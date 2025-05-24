import express from 'express';
import { execa } from 'execa';
import { requireAuth } from '../middleware/requireAuth.js';
import supabase from '../services/supabase.js';
import fs from 'fs';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
	const { youtubeUrl } = req.body;
	const userId = req.user.id;
	const filePath = `downloads/video-${Date.now()}.mp4`;

	try {
		const subprocess = execa('yt-dlp', ['-o', filePath, youtubeUrl]);

		subprocess.stdout?.on('data', (data) => {
			console.log(`[yt-dlp] ${data.toString()}`);
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

		res.json({ message: 'Download complete', filePath });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Download failed' });
	}
});

export default router;
