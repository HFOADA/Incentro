import express from 'express';
import { discoverMusic, createSpotifyPlaylist } from '../services/discoveryService.js';

const router = express.Router();

/**
 * Lokaal geheugen (In-memory storage) om de lopende conversatie te onthouden.
 * Dit zorgt ervoor dat de AI context heeft (bijv. "iets sneller").
 */
let chatHistory = [];

/**
 * POST /api/discover
 * Het hoofd-endpoint dat de gebruikersvraag koppelt aan de AI en Spotify.
 */
router.post('/discover', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Geen zoekopdracht ontvangen." });
  }
  
  // 1. Sla de vraag van de gebruiker op in de tijdlijn
  chatHistory.push({ role: "user", content: prompt });

  // 2. Beperk de geschiedenis tot de laatste 10 berichten om 'token-vervuiling' te voorkomen
  if (chatHistory.length > 10) chatHistory.shift();

  try {
    // 3. Start het AI-ontdekkingsproces met de opgebouwde geschiedenis
    const result = await discoverMusic(chatHistory);
    
    // 4. Sla de uitleg van de AI op in de geschiedenis voor de volgende vraag (context)
    if (result && result.explanation) {
      chatHistory.push({ role: "assistant", content: result.explanation });
    }

    res.json(result);
  } catch (error) {
    console.error("❌ Fout in /api/discover route:", error.message);
    res.status(500).json({ error: "Serverfout bij het ontdekken van muziek." });
  }
});

/**
 * POST /api/create-playlist
 * Endpoint om de gevonden nummers fysiek op te slaan in het Spotify-profiel.
 */
router.post('/create-playlist', async (req, res) => {
  const { name, trackUris } = req.body;
  
  if (!trackUris || trackUris.length === 0) {
    return res.status(400).json({ error: "Geen nummers geselecteerd voor de playlist." });
  }

  try {
    const url = await createSpotifyPlaylist(name, trackUris);
    console.log(`✅ Playlist '${name}' succesvol aangemaakt.`);
    res.json({ success: true, url });
  } catch (error) {
    console.error("❌ Fout in /api/create-playlist route:", error.message);
    res.status(500).json({ error: "Kon de playlist niet aanmaken op Spotify." });
  }
});

/**
 * POST /api/reset
 * Leegt de chatgeschiedenis voor een volledig nieuw gespreksonderwerp.
 */
router.post('/reset', (req, res) => {
    chatHistory = [];
    console.log("🧹 Chatgeschiedenis gereset.");
    res.json({ success: true });
});

export default router;