import express from 'express';
import { execa } from 'execa';
import { requireAuth } from '../middleware/requireAuth.js';
import { userSockets } from '../server.js';
import supabase from '../services/supabase.js';
import fs from 'fs';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
	const { youtubeUrl } = req.body;
	console.log('Got req', youtubeUrl);
	const userId = req.user.sub;
	const filePath = `downloads/video-${Date.now()}.mp4`;

	try {
		// Step 1: Use yt-dlp to fetch metadata
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

		// Step 2: Start download
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
				console.log(percent);
				const socket = userSockets.get(userId);
				if (socket?.readyState === 1) {
					socket.send(
						JSON.stringify({ type: 'progress', progress: percent })
					);
				}
			}
		});

		subprocess.stderr?.on('data', (data) => {
			console.error(`[yt-dlp error] ${data.toString()}`);
		});

		await subprocess;

		// Step 3: Store in DB
		await supabase.from('videos').insert([
			{
				user_id: userId,
				youtube_url: youtubeUrl,
				file_path: filePath,
				title,
				duration,
			},
		]);

		// Step 4: Notify frontend
		const socket = userSockets.get(userId);
		if (socket?.readyState === 1) {
			socket.send(JSON.stringify({ type: 'done', filePath }));
		}
		res.json({ message: 'Download complete', filePath });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Download failed' });
	}
});

export default router;
