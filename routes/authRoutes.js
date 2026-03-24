import express from 'express';
import spotifyApi from '../config/spotifyClient.js';

const router = express.Router();

/**
 * GET /login
 * Start de Spotify OAuth flow.
 * De gebruiker wordt doorgestuurd naar de officiële Spotify inlogpagina.
 */
router.get('/login', (req, res) => {
  // Rechten die we nodig hebben: profiel inzien en playlists beheren
  const scopes = ['user-read-private', 'user-read-email', 'playlist-modify-public'];
  
  // Genereer de URL voor de Spotify login
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
  res.redirect(authorizeURL);
});

/**
 * GET /callback
 * De plek waar Spotify de gebruiker naar terugstuurt na inloggen.
 * Hier wisselen we de tijdelijke 'code' in voor een definitief Access Token.
 */
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Inloggen geannuleerd of mislukt.');
  }

  try {
    // Wissel de autorisatiecode in voor tokens
    const data = await spotifyApi.authorizationCodeGrant(code);
    
    // Sla het access token op in de Spotify API instantie voor toekomstige verzoeken
    spotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi.setRefreshToken(data.body['refresh_token']);

    console.log('✅ Gebruiker succesvol ingelogd bij Spotify.');
    
    // Stuur de gebruiker terug naar de homepage (waar de search sectie nu zichtbaar wordt)
    res.redirect('/');
  } catch (error) {
    console.error('❌ Fout tijdens de Spotify callback:', error.message);
    res.status(500).send('Authenticatie fout: ' + error.message);
  }
});

/**
 * GET /api/auth-status
 * Helper endpoint voor de frontend om te checken of we al een geldig token hebben.
 */
router.get('/api/auth-status', (req, res) => {
  const isAuthenticated = !!spotifyApi.getAccessToken();
  res.json({ isAuthenticated });
});

export default router;