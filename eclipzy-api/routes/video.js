// backend/routes/video.js
import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.get('/:filename', (req, res) => {
	const file = path.resolve('downloads', req.params.filename);

	if (!fs.existsSync(file)) return res.sendStatus(404);

	const stat = fs.statSync(file);
	const fileSize = stat.size;
	const range = req.headers.range;

	if (range) {
		const parts = range.replace(/bytes=/, '').split('-');
		const start = parseInt(parts[0], 10);
		const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
		const chunkSize = end - start + 1;
		const stream = fs.createReadStream(file, { start, end });

		res.writeHead(206, {
			'Content-Range': `bytes ${start}-${end}/${fileSize}`,
			'Accept-Ranges': 'bytes',
			'Content-Length': chunkSize,
			'Content-Type': 'video/mp4',
			'Content-Disposition': 'inline',
			'X-Content-Type-Options': 'nosniff',
			'Cache-Control': 'no-store',
		});

		stream.pipe(res);
	} else {
		res.writeHead(200, {
			'Content-Length': fileSize,
			'Content-Type': 'video/mp4',
		});
		fs.createReadStream(file).pipe(res);
	}
});

export default router;
