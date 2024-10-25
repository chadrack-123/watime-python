import express from 'express';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
dotenv.config();
const db = new sqlite3.Database('users.db');

app.use(cors({
    origin: 'http://127.0.0.1:5500'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function (err) {
            if (err) {
                return res.status(500).json({ error: 'User already exists or database error' });
            }
            res.status(201).json({ message: 'User Account created successfully. Try to login now...' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Error creating user account' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        res.status(200).json({ message: 'Logged in successfully', redirect: '/dashboard' });
    });
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/myfield', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'myfield.html'));
});

app.get('/tips', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tips.html'));
});
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/logout', (req, res) => {

    // If using sessions, you would destroy the session here
    // req.session.destroy(err => {
    //     if (err) {
    //         return res.redirect('/dashboard');
    //     }
    //     res.clearCookie('sessionId');
    //     res.redirect('/login');
    // });

    // For simplicity, just redirect to login

    res.redirect('/login.html');
});

app.get('/weather/:city', async (req, res) => {
    const city = req.params.city;
    const apiKey = '1233d72f3902757e52874de28a6e5e60';
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;

    try {
        const [currentWeather, forecast] = await Promise.all([
            axios.get(currentWeatherUrl),
            axios.get(forecastUrl)
        ]);

        res.json({
            currentWeather: currentWeather.data,
            forecast: forecast.data.list,
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching weather data', error });
    }
});

app.get('/weather/location', async (req, res) => {
    const lat = req.query.lat;
    const lon = req.query.lon;

    if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing latitude or longitude' });
    }

    try {
        const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=YOUR_API_KEY`);
        const forecastResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=YOUR_API_KEY`);

        res.json({
            currentWeather: weatherResponse.data,
            forecast: forecastResponse.data.list
        });
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

app.post('/predict', async (req, res) => {
    try {
        const features = req.body.features;

        if (!features || !Array.isArray(features)) {
            return res.status(400).json({ error: 'Invalid features array.' });
        }

        const modelResponse = await axios.post('http://localhost:3000/predict', {
            features: features
        });

        const predictionResult = modelResponse.data;

        res.json(predictionResult);
    } catch (error) {
        console.error('Error making prediction:', error);
        res.status(500).json({ error: error });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
