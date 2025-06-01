// utils/transcribe.js
import { spawn } from 'child_process';
import fs from 'fs';

/**
 *
 * @param {string} absPath Absolute path to the input video file
 * @param {string} whisperOut Path to expected Whisper .json output
 * @param {string} folder Directory to run Whisper inside
 * @param {function} onProgress Callback(percent: number)
 * @param {string} durationStr e.g. "3:02"
 */
export async function runWhisper(
	absPath,
	whisperOut,
	folder,
	onProgress,
	durationStr = ''
) {
	return new Promise((resolve, reject) => {
		if (fs.existsSync(whisperOut)) return resolve();

		const whisperCmd = `whisper "${absPath}" --model base --output_format json --output_dir "${folder}" --word_timestamps True`;

		let totalSeconds = 0;
		const match = durationStr.match(/(\d+):(\d+)/);
		if (match) {
			const minutes = parseInt(match[1], 10);
			const seconds = parseInt(match[2], 10);
			totalSeconds = minutes * 60 + seconds;
		}

		const proc = spawn(whisperCmd, {
			shell: true,
			env: { ...process.env, PYTHONUNBUFFERED: '1' },
		});

		proc.stdout.on('data', (data) => {
			const text = data.toString();

			// Looks like: [02:44.720 --> 02:45.320]
			const match = text.match(/\[(\d{2}):(\d{2})\.(\d{2,3}) -->/);
			if (match && totalSeconds > 0) {
				const min = parseInt(match[1], 10);
				const sec = parseInt(match[2], 10);
				const ms = parseInt(match[3], 10);
				const currentSec = min * 60 + sec + ms / 1000;

				const progress = Math.min(
					100,
					Math.round((currentSec / totalSeconds) * 100)
				);
				onProgress?.(progress);
			}
		});

		proc.stderr.on('data', (data) =>
			console.error(`[whisper stderr] ${data.toString()}`)
		);

		proc.on('close', (code) => {
			if (code !== 0 || !fs.existsSync(whisperOut)) {
				return reject(new Error('Whisper failed'));
			}
			onProgress?.(100);
			resolve();
		});
	});
}
