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
		const subprocess = execa('yt-dlp', ['-o', filePath, youtubeUrl]);

		subprocess.stdout?.on('data', (data) => {
			const text = data.toString();
			//console.log(`[yt-dlp] ${text}`);

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

		await supabase.from('videos').insert([
			{
				user_id: userId,
				youtube_url: youtubeUrl,
				file_path: filePath,
			},
		]);

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
