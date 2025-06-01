import express from 'express';
import { execa } from 'execa';
import { requireAuth } from '../middleware/requireAuth.js';
import { userSockets } from '../server.js';
import supabase from '../services/supabase.js';
import fs from 'fs';
import path from 'path';
import { runWhisper } from '../utils/transcribe.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
	const { youtubeUrl } = req.body;
	console.log('Got req', youtubeUrl);
	const userId = req.user.sub;
	const filePath = `downloads/video-${Date.now()}.mp4`;

	try {
		// Step 1: Fetch metadata
		const metaResult = await execa('yt-dlp', ['--dump-json', youtubeUrl]);
		const meta = JSON.parse(metaResult.stdout);
		const title = meta.title || 'Untitled';
		const videoId = meta.id;
		const durationSeconds = meta.duration;
		const duration =
			durationSeconds != null
				? `${Math.floor(durationSeconds / 60)}:${String(
						durationSeconds % 60
				  ).padStart(2, '0')}`
				: null;

		// Step 2: Download the video
		const subprocess = execa('yt-dlp', [
			'-f',
			'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
			'-o',
			filePath,
			youtubeUrl,
		]);

		subprocess.stdout?.on('data', (data) => {
			const text = data.toString();
			const match = text.match(/\[download\]\s+(\d+\.\d+)%/);
			if (match) {
				const percent = parseFloat(match[1]);
				const socket = userSockets.get(userId);
				if (socket?.readyState === 1) {
					socket.send(
						JSON.stringify({
							type: 'progress',
							stage: 'downloading',
							progress: percent,
						})
					);
				}
			}
		});

		subprocess.stderr?.on('data', (data) => {
			console.error(`[yt-dlp error] ${data.toString()}`);
		});

		await subprocess;

		// Step 3: Run Whisper
		const folder = path.dirname(filePath);
		const baseName = path.basename(filePath).replace('.mp4', '');
		const whisperOut = path.join(folder, `${baseName}.json`);

		const socket = userSockets.get(userId);
		if (socket?.readyState === 1) {
			socket.send(
				JSON.stringify({
					type: 'progress',
					stage: 'transcribing',
					progress: 0,
				})
			);
		}

		await runWhisper(
			filePath,
			whisperOut,
			folder,
			(progress) => {
				if (socket?.readyState === 1) {
					socket.send(
						JSON.stringify({
							type: 'progress',
							stage: 'transcribing',
							progress,
						})
					);
				}
			},
			duration
		); // <- pass mm:ss string here

		// Step 4: Store in DB
		await supabase.from('videos').insert([
			{
				user_id: userId,
				youtube_url: youtubeUrl,
				file_path: filePath,
				title,
				duration,
			},
		]);

		// Step 5: Done
		if (socket?.readyState === 1) {
			socket.send(JSON.stringify({ type: 'done', filePath }));
		}

		res.json({ message: 'Download + transcription complete', filePath });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to extract and transcribe' });
	}
});

export default router;
