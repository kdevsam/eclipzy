// backend/server.js
import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import dotenv from 'dotenv';
import extractRouter from './routes/extract.js';
import fs from 'fs';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';

// Load env vars
dotenv.config();

// App + WebSocket setup
const app = express();
const wsInstance = expressWs(app);
const wss = wsInstance.getWss();

// Map: userId → WebSocket
export const userSockets = new Map();

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

// Ensure downloads folder exists
if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads');

// Express Middlewares
app.use(
	cors({
		origin: 'http://localhost:3000',
		credentials: true,
	})
);
app.use(express.json());

// WebSocket connection auth + setup
app.ws('/', (ws, req) => {
	try {
		const cookies = cookie.parse(req.headers.cookie || '');
		const tokenRaw = Object.values(cookies).find((c) =>
			c.startsWith('base64-')
		);
		if (!tokenRaw) throw new Error('Missing auth cookie');
		console.log(cookies);
		const decoded = Buffer.from(
			tokenRaw.replace('base64-', ''),
			'base64'
		).toString('utf8');
		const token = JSON.parse(decoded);
		const payload = jwt.verify(token.access_token, JWT_SECRET);
		const userId = payload.sub;

		userSockets.set(userId, ws);
		console.log(`✅ WebSocket connected: ${userId}`);

		ws.on('close', () => {
			userSockets.delete(userId);
			console.log(`❌ WebSocket disconnected: ${userId}`);
		});
	} catch (err) {
		console.error('WebSocket auth failed:', err.message);
		ws.close();
	}
});

// Routes
app.use('/api/extract', extractRouter);

app.get('/', (req, res) => {
	res.send(
		`Eclipzy API is running in ${
			process.env.ENVIRONMENT || 'development'
		} mode`
	);
});

// Start server
app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
});
