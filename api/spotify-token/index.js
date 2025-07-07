const axios = require('axios');

module.exports = async function (context, req) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        context.res = {
            status: 500,
            body: { error: 'Spotify credentials are not configured on the server.' }
        };
        return;
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

        context.res = {
            body: { access_token: tokenResponse.data.access_token }
        };
    } catch (error) {
        context.log.error('Error fetching Spotify token:', error.response ? error.response.data : error.message);
        context.res = {
            status: 500,
            body: { error: 'Failed to retrieve Spotify token.' }
        };
    }
};