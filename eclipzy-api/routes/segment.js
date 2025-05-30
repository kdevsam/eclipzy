// backend/routes/segment.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import {
	rateClipQuality,
	rateCollectiveClip,
	generateClipTitle,
} from '../services/openai-clipscorer.js';
import { generateSRT } from '../utils/generateSRT.js';

const router = express.Router();

// Helper to run Whisper transcription
async function runWhisper(absPath, whisperOut, folder) {
	return new Promise((resolve, reject) => {
		if (fs.existsSync(whisperOut)) {
			return resolve();
		}
		const whisperCmd = `whisper "${absPath}" --model base --output_format json --output_dir "${folder}" --word_timestamps True --verbose True`;

		console.log(whisperCmd);
		const whisperProc = spawn(whisperCmd, {
			shell: true,
			env: {
				...process.env,
				PYTHONUNBUFFERED: '1',
			},
		});

		whisperProc.stdout.on('data', (data) => {
			console.log(`[whisper] ${data.toString()}`);
		});

		whisperProc.stderr.on('data', (data) => {
			console.error(`[whisper error] ${data.toString()}`);
		});

		whisperProc.on('close', (code) => {
			if (code !== 0 || !fs.existsSync(whisperOut)) {
				return reject(new Error('Whisper transcription failed'));
			}
			resolve();
		});
	});
}

// Convert SRT to styled ASS subtitle
function convertSrtToAss(srtPath, assPath, styleOverride = {}) {
	const tempAss = assPath.replace('.ass', '_raw.ass');
	execSync(`ffmpeg -y -i "${srtPath}" "${tempAss}"`);

	const assContent = fs.readFileSync(tempAss, 'utf-8');
	const styleBlock = `
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${styleOverride.font || 'Arial'},${
		styleOverride.size || 28
	},&H00FFFFFF,&H000000FF,&H80000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,${
		styleOverride.align || 2
	},10,10,10,1
`;

	const finalAss = assContent.replace(
		/\[V4\+ Styles\][\s\S]*?\[Events\]/,
		styleBlock + '\n[Events]'
	);

	fs.writeFileSync(assPath, finalAss);
	fs.unlinkSync(tempAss);
}

export async function clipWithFadeAndSubs(
	absPath,
	clipPath,
	start,
	end,
	srtPath,
	portrait = true // default true for portrait mode
) {
	const assPath = srtPath.replace('.srt', '.ass');
	convertSrtToAss(srtPath, assPath);

	const duration = parseFloat((end - start).toFixed(3));
	const clipDir = path.dirname(clipPath);
	const assFilename = path.basename(assPath);
	const clipFilename = path.basename(clipPath);

	const vfFilters = [
		`ass='${assFilename}'`,
		`fade=t=in:st=0:d=0.5`,
		`fade=t=out:st=${(duration - 0.5).toFixed(3)}:d=0.5`,
	];

	if (portrait) {
		// Scale to fit width, pad to 1080x1920
		vfFilters.push(
			`scale=w=1080:h=-1:force_original_aspect_ratio=decrease`,
			`pad=1080:1920:(ow-iw)/2:(oh-ih)/2`
		);
	}

	const cmd =
		`ffmpeg -y -ss ${start} -t ${duration} -i "${absPath}" ` +
		`-vf "${vfFilters.join(',')}" ` +
		`-af "afade=t=in:st=0:d=0.5,afade=t=out:st=${(duration - 0.5).toFixed(
			3
		)}:d=0.5" ` +
		`-c:v libx264 -c:a aac -strict experimental "${clipFilename}"`;

	console.log(cmd);
	return new Promise((resolve, reject) => {
		spawn(cmd, { shell: true, cwd: clipDir }).on('close', (code) =>
			code === 0
				? resolve()
				: reject(new Error(`ffmpeg exited with code ${code}`))
		);
	});
}

// Helper to clip top segments
async function generateClips(absPath, segments, folder, clipsDir, fileName) {
	const windows = [];
	let i = 0;
	const stepSize = 5;

	while (i < segments.length) {
		let start = segments[i].start;
		let end = start;
		let text = '';
		let j = i;

		while (j < segments.length && end - start < 30) {
			end = segments[j].end;
			text += ' ' + segments[j].text;
			j++;
		}

		if (end - start >= 15) {
			windows.push({ start, end, text: text.trim() });
		}

		const nextTarget = start + stepSize;
		i = segments.findIndex((s) => s.start >= nextTarget);
		if (i === -1) break;
	}

	const rated = await Promise.all(
		windows.map(async (w, index) => {
			const score = await rateClipQuality(w.text);
			const collective = await rateCollectiveClip(w.text);
			const combined = parseFloat(
				(score * 0.4 + collective * 0.6).toFixed(2)
			);

			return {
				...w,
				score,
				collectiveScore: collective,
				combinedScore: combined,
				index,
			};
		})
	);

	const top5 = rated
		.sort((a, b) => b.combinedScore - a.combinedScore)
		.slice(0, 5);

	const clips = [];
	for (const clip of top5) {
		const title = await generateClipTitle(clip.text);
		const clipPath = path.join(clipsDir, `clip-${clip.index + 1}.mp4`);
		const srtPath = path.join(clipsDir, `clip-${clip.index + 1}.srt`);
		generateSRT(segments, clip.start, clip.end, srtPath);
		await clipWithFadeAndSubs(
			absPath,
			clipPath,
			clip.start,
			clip.end,
			srtPath
		);

		clips.push({
			file: `/downloads/${path.basename(folder)}/clips/clip-${
				clip.index + 1
			}.mp4`,
			start: clip.start,
			end: clip.end,
			score: clip.score,
			collectiveScore: clip.collectiveScore,
			combinedScore: clip.combinedScore,
			text: clip.text,
			title,
		});
		console.log(clips);
	}

	return clips;
}

router.post('/', async (req, res) => {
	const { filePath } = req.body;

	if (!filePath || !fs.existsSync(filePath)) {
		console.log(filePath);
		return res.status(400).json({ error: 'Missing or invalid file path' });
	}
	res.json({ message: 'Processing Video File' });

	const absPath = path.resolve(filePath);
	const folder = path.dirname(absPath);
	let fileName = path.basename(filePath);
	const clipsDir = path.join(folder, 'clips');
	if (!fs.existsSync(clipsDir)) fs.mkdirSync(clipsDir);
	if (fileName.includes('.')) fileName = fileName.split('.')[0];

	const whisperOut = path.join(folder, `${fileName}.json`);
	console.log(whisperOut);
	try {
		await runWhisper(absPath, whisperOut, folder);
		const raw = fs.readFileSync(whisperOut, 'utf-8');
		const json = JSON.parse(raw);
		const segments = json.segments || [];

		await generateClips(absPath, segments, folder, clipsDir, fileName);
	} catch (err) {
		console.error('[Segment Error]', err.message);
		return res.status(500).json({ error: 'Failed to segment and clip' });
	}
});

export default router;
