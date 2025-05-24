// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import extractRouter from './routes/extract.js';
import fs from 'fs';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ensure downloads folder exists
if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads');

// Routes
app.use('/api/extract', extractRouter);

app.get('/', (req, res) => {
	res.send(
		`Eclipzy API is running in ${
			process.env.ENVIRONMENT || 'development'
		} mode`
	);
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
