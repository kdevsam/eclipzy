import supabase from '../services/supabase.js';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';

function decodeSupabaseToken(raw) {
	if (!raw.startsWith('base64-')) return raw;

	try {
		const base64 = raw.slice(7);
		const decoded = Buffer.from(base64, 'base64').toString('utf8');
		return decoded;
	} catch (err) {
		console.error('Failed to decode base64 token:', err);
		return null;
	}
}

export const requireAuth = async (req, res, next) => {
	const { token } = req.body;
	const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
	if (!token) {
		return res.status(401).json({ error: 'Missing auth token' });
	}
	try {
		const decoded = jwt.verify(token.data.session.access_token, JWT_SECRET);
		req.user = decoded;
		next();
	} catch (err) {
		console.error('JWT error:', err.message);
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
};
