const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// These credentials will be read from your Azure App Service Configuration
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

// Serve static files (your HTML, CSS, JS) from the root directory
app.use(express.static(path.join(__dirname, '')));

// API endpoint for the frontend to get a Spotify token
app.get('/api/spotify-token', async (req, res) => {
    if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Spotify credentials are not configured on the server.' });
    }

    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const tokenResponse = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: 'grant_type=client_credentials'
        });

        res.json({ access_token: tokenResponse.data.access_token });
    } catch (error) {
        console.error('Error fetching Spotify token:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to retrieve Spotify token.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});