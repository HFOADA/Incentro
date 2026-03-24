import SpotifyWebApi from 'spotify-web-api-node';
import 'dotenv/config';

/**
 * Validatie: Controleer of de essentiële Spotify-credentials aanwezig zijn.
 * Zonder deze keys kan de app geen verbinding maken met de Spotify API.
 */
if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  console.error("❌ Fout: SPOTIFY_CLIENT_ID of SPOTIFY_CLIENT_SECRET ontbreekt in .env!");
  process.exit(1);
}

/**
 * Initialisatie van de Spotify Web API instantie.
 * We gebruiken 127.0.0.1 (Feb 2026 standaard) voor lokale ontwikkeling.
 */
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'http://127.0.0.1:3000/callback' 
});

/**
 * Client Credentials Authentication.
 * Deze functie wordt gebruikt voor algemene acties waarbij geen 
 * specifieke gebruikers-login vereist is (zoals het testen van de verbinding).
 */
export const authenticateSpotify = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi.setClientId(process.env.SPOTIFY_CLIENT_ID);
    spotifyApi.setClientSecret(process.env.SPOTIFY_CLIENT_SECRET);
    console.log('✅ Spotify succesvol geauthenticeerd via Client Credentials!');
  } catch (error) {
    console.error('❌ Spotify Client Auth Error:', error.message);
  }
};

/**
 * Exporteer de geconfigureerde API-instantie.
 * In server.js vullen we deze aan met de User Access Token na de login.
 */
export default spotifyApi;