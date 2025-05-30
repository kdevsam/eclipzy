import fs from 'fs';
import path from 'path';

export function generateSRT(segments, clipStart, clipEnd, outputPath) {
	let srt = '';
	let index = 1;

	const words = segments
		.flatMap((seg) => seg.words || [])
		.filter((word) => word.start >= clipStart && word.end <= clipEnd);

	for (const word of words) {
		const start = word.start - clipStart;
		const end = word.end - clipStart;
		srt += `${index++}\n${formatTime(start)} --> ${formatTime(end)}\n${
			word.word
		}\n\n`;
	}

	fs.writeFileSync(outputPath, srt);
}

export function generateSmartSRT(segments, clipStart, clipEnd, outputPath) {
	let srt = '';
	let index = 1;

	const words = segments
		.flatMap((seg) => seg.words || [])
		.filter((word) => word.start >= clipStart && word.end <= clipEnd);

	let buffer = [];
	let groupStart = null;

	function flushGroup() {
		if (buffer.length === 0) return;

		const start = buffer[0].start - clipStart;
		const end = buffer[buffer.length - 1].end - clipStart;
		const text = buffer
			.map((w) => w.word)
			.join(' ')
			.trim();

		srt += `${index++}\n${formatTime(start)} --> ${formatTime(
			end
		)}\n${text}\n\n`;
		buffer = [];
	}

	let i = 0;
	while (i < words.length) {
		const word = words[i];
		buffer.push(word);

		// Flush if:
		// - Group is 2–3 words
		// - OR current word ends with punctuation
		const endsWithPunct = /[.?!,]$/.test(word.word);
		const groupSize = buffer.length;

		if (groupSize >= 2 && (groupSize >= 3 || endsWithPunct)) {
			flushGroup();
		}

		i++;
	}
	flushGroup(); // flush remainder

	fs.writeFileSync(outputPath, srt);
}

function formatTime(seconds) {
	const ms = Math.floor((seconds % 1) * 1000);
	const totalSecs = Math.floor(seconds);
	const hrs = Math.floor(totalSecs / 3600);
	const mins = Math.floor((totalSecs % 3600) / 60);
	const secs = totalSecs % 60;
	return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
}

function pad(num, size = 2) {
	return num.toString().padStart(size, '0');
}
