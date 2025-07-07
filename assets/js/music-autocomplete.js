/*
 * Spotify Song Autocomplete
 *
 * This script uses the Spotify API to provide song suggestions
 * as a user types in the playlist request form.
*/
$(function() {
    // This script requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to be set
    // in the Azure Static Web App's Application Settings.

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
            const contentType = response.headers.get("content-type");

            // If the response is not OK or not JSON, we can't parse it.
            // This handles both true 404s and HTML fallback pages.
            if (!response.ok || !contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                throw new Error(`Server did not return valid JSON. Status: ${response.status}. Response: ${text.substring(0, 100)}...`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(`API returned an error: ${data.error}`);
            }

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