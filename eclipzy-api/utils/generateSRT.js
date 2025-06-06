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

export function generateSmartASS(
	segments,
	clipStart,
	clipEnd,
	outputPath,
	captionFontSize = 128,
	bounce = true
) {
	const words = segments
		.flatMap((seg) => seg.words || [])
		.filter((w) => w.start >= clipStart && w.end <= clipEnd);

	const header = `[Script Info]
Title: Smart Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,${captionFontSize},&H00FFFFFF,&H000000FF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,3,1,2,10,10,50,1
Style: Highlight,Arial,${captionFontSize},&H00FFFF00,&H000000FF,&H00303000,&H64000000,1,0,0,0,100,100,0,0,1,3,2,2,10,10,50,1


[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

	let dialogue = '';
	let i = 0;

	while (i < words.length) {
		const group = [];
		let j = i;

		// Collect 2–3 words into the group
		while (j < words.length && group.length < 3) {
			const curr = words[j];
			group.push(curr);

			const next = words[j + 1];
			if (
				!next ||
				next.start - curr.end > 0.5 ||
				/[.?!]$/.test(curr.word)
			)
				break;
			j++;
		}

		// One line per word in group with only one highlighted
		for (let k = 0; k < group.length; k++) {
			const word = group[k];
			const start = word.start - clipStart;
			const end = word.end - clipStart;

			const line = group
				.map((w, idx) => {
					const safeWord = w.word.replace(/[{}]/g, ''); // avoid malformed tags
					return idx === k
						? `{\\rHighlight}${safeWord}`
						: `{\\rDefault}${safeWord}`;
				})
				.join(' ');

			dialogue += `\nDialogue: 0,${formatASSTime(start)},${formatASSTime(
				end
			)},Default,,0,0,0,,${line}`;
		}

		i += group.length; // ✅ Advance whole group (no overlapping duplication)
	}

	fs.writeFileSync(outputPath, `${header}${dialogue}`);
}

function formatASSTime(seconds) {
	const hrs = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);
	const cs = Math.floor((seconds % 1) * 100);
	return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(cs)}`;
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
