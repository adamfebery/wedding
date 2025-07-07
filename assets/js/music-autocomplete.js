/*
 * Spotify Song Autocomplete
 *
 * This script uses the Spotify API to provide song suggestions
 * as a user types in the playlist request form.
*/
$(function() {

    // =========================================================================
    // IMPORTANT: NEXT STEPS
    // =========================================================================
    // 1. Go to the Spotify Developer Dashboard: https://developer.spotify.com/dashboard/
    // 2. Create a new App to get a Client ID and a Client Secret.
    // 3. Because you cannot safely store a Client Secret in frontend JavaScript,
    //    you will need a small backend or serverless function to exchange your
    //    credentials for an access token.
    //
    //    For a static site, a Netlify Function, Vercel Function, or similar
    //    is a perfect, free solution for this.
    //
    // 4. This function will make a POST request to:
    //    `https://accounts.spotify.com/api/token`
    //    with `grant_type=client_credentials`
    //    and your `Authorization: Basic <base64_encoded_client_id:client_secret>` header.
    //
    // 5. Your serverless function should return just the `access_token` from Spotify's response.
    // =========================================================================

    const TOKEN_URL = '/api/spotify-token'; // URL to your new backend endpoint
    let spotifyAccessToken = null;

    /**
     * Fetches the Spotify access token from our secure serverless function.
     * Caches the token to avoid fetching it on every request.
     */
    async function getSpotifyToken() {
        if (spotifyAccessToken) {
            return spotifyAccessToken;
        }

        try {
            const response = await fetch(TOKEN_URL);
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`Token request failed: ${errorBody.error}`);
            }
            const data = await response.json();
            spotifyAccessToken = data.access_token;
            return spotifyAccessToken;

        } catch (error) {
            console.error('Error fetching Spotify token:', error);
            return null;
        }
    }

    // Initialize jQuery UI Autocomplete on the song input field
    $("#song-input").autocomplete({
        // The source function is called when the user types
        source: async function(request, response) {
            const token = await getSpotifyToken();

            if (!token) {
                response([]); // Return empty array if we don't have a token
                return;
            }

            const artist = $("#artist-input").val();
            const song = request.term;

            // Build the search query for the Spotify API
            let query = song;
            if (artist) {
                query += ` artist:${artist}`;
            }

            // Make the API call to Spotify
            $.ajax({
                url: "https://api.spotify.com/v1/search",
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                data: {
                    q: query,
                    type: 'track',
                    limit: 10 // Get up to 10 suggestions
                },
                success: function(data) {
                    // Map the Spotify response to the format jQuery UI expects
                    const suggestions = $.map(data.tracks.items, function(track) {
                        return {
                            label: `${track.artists[0].name} - ${track.name}`, // Text shown in the dropdown
                            value: track.name, // Value placed in the input when selected
                            artist: track.artists[0].name
                        };
                    });
                    response(suggestions);
                }
            });
        },
        // The select function is called when a user clicks a suggestion
        select: function(event, ui) {
            $("#song-input").val(ui.item.value);
            $("#artist-input").val(ui.item.artist);
            return false; // Prevent the default behavior of filling the input with the "label"
        },
        minLength: 2 // Start searching after 2 characters are typed
    });
});