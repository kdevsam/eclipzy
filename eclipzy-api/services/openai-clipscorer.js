import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🎯 Prompt for punchiness / virality potential
export async function rateClipQuality(text) {
	const prompt = `Rate the following video clip transcript from 0.0 to 10.0 based on how likely it is to go viral as a YouTube Short.
Consider emotional impact, relatability, surprise, humor, storytelling, and punchy delivery.
Only respond with a float score (e.g. 8.5). Do not include explanation.

Transcript:
"${text}"`;

	try {
		const res = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: [{ role: 'user', content: prompt }],
			max_tokens: 10,
		});

		const raw = res.choices[0].message.content.trim();
		const score = parseFloat(raw);
		if (isNaN(score)) throw new Error('Invalid score');
		return Math.min(10, Math.max(0, parseFloat(score.toFixed(2))));
	} catch (err) {
		console.error('[rateClipQuality] GPT error:', err.message);
		return 0;
	}
}

// 🎯 Prompt for overall cohesion, arc, retention
export async function rateCollectiveClip(text) {
	const prompt = `You are a YouTube Shorts editor.
Given the full transcript of a 30-second video clip, rate how compelling it is overall on a scale from 0.0 to 10.0.
Focus on story arc, relatability, originality, and how likely it is to hold viewer attention.
Respond only with a float like 8.7. Do not explain.

Transcript:
"${text}"`;

	try {
		const res = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: [{ role: 'user', content: prompt }],
			max_tokens: 10,
		});

		const raw = res.choices[0].message.content.trim();
		const score = parseFloat(raw);
		if (isNaN(score)) throw new Error('Invalid score');
		return Math.min(10, Math.max(0, parseFloat(score.toFixed(2))));
	} catch (err) {
		console.error('[rateCollectiveClip] GPT error:', err.message);
		return 0;
	}
}

export async function generateClipTitle(text) {
	const prompt = `You are a top-tier viral YouTube Shorts editor with experience writing insanely clickable video titles. 

Generate a single punchy and emotionally charged title (MAX 50 characters) for the following 30-second video clip transcript. 

Your goal is to make people stop scrolling and click immediately.

Use curiosity, shock, humor, contradiction, or inspiration. Avoid generic titles.

Transcript:
"${text}"

Output just the title.`;

	try {
		const res = await openai.chat.completions.create({
			model: 'gpt-4', // try 4 if you have access, else keep 3.5
			messages: [{ role: 'user', content: prompt }],
			max_tokens: 30,
		});

		return res.choices[0].message.content.trim().replace(/^"|"$/g, '');
	} catch (err) {
		console.error('[generateClipTitle] GPT error:', err.message);
		return '';
	}
}
