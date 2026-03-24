import openai from '../config/openaiClient.js';
import spotifyApi, { authenticateSpotify } from '../config/spotifyClient.js';

/**
 * Hoofdfunctie voor AI-gestuurde muziekontdekking.
 * Combineert OpenAI GPT-4o-mini voor context-begrip en de Spotify API voor data.
 * @param {Array} history - De volledige chatgeschiedenis voor contextueel geheugen.
 */
export const discoverMusic = async (history) => {
  try {
    // 1. OpenAI aanroepen om de chatgeschiedenis te vertalen naar technische parameters
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Je bent een AI Muziek Curator. Geef JSON terug. 
          BELANGRIJK: Gebruik voor seed_genres maximaal 3 genres uit deze lijst: 
          [acoustic, classical, dance, electronic, hip-hop, indie, jazz, pop, rock, techno]. 
          Geef ALTIJD JSON: seed_genres, target_energy, target_valence, explanation, mood_tags, dominant_genre.`
        },
        ...history // Context van het huidige gesprek
      ],
      response_format: { type: "json_object" }
    });

    const rawContent = aiResponse.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error("❌ OpenAI respons structuur is onverwacht:", aiResponse);
      throw new Error("De AI gaf geen geldig antwoord terug.");
    }

    const data = JSON.parse(rawContent);

    // Harde check: als de AI iets geks stuurt, val terug op een veilig genre
    const validSeeds = data.seed_genres.filter(g => 
        ['acoustic', 'classical', 'dance', 'electronic', 'hip-hop', 'indie', 'jazz', 'pop', 'rock', 'techno'].includes(g)
    );

    const finalSeeds = validSeeds.length > 0 ? validSeeds : ['pop']; // Altijd minimaal 1 valide seed
    
    await authenticateSpotify();

    const targetEnergy = parseFloat(data.target_energy) || 0.5; // Val terug op 0.5 als het NaN is
    const targetValence = parseFloat(data.target_valence) || 0.5;

    // 2. Spotify API aanroepen om aanbevelingen op te halen
    const spotifyData = await spotifyApi.getRecommendations({ 
      limit: 8, 
      seed_genres: finalSeeds,
      target_energy: targetEnergy,
      target_valence: targetValence
    });

    // Validatie: Heeft Spotify daadwerkelijk nummers gevonden?
    if (!spotifyData.body.tracks || spotifyData.body.tracks.length === 0) {
      return { error: "Spotify vond geen nummers voor deze combinatie. Probeer een andere omschrijving." };
    }

    // 3. Data formatteren voor de frontend (Feb 2026 standaard)
    return {
      explanation: data.explanation,
      tags: data.mood_tags,
      mainGenre: data.dominant_genre,
      tracks: spotifyData.body.tracks.map(t => ({
        name: t.name,
        artist: t.artists.map(a => a.name).join(', '),
        // Herstelde URL string (mistte schuine streep en variabelen-notatie)
        spotifyUrl: `https://open.spotify.com/{t.id}`, 
        uri: t.uri, 
        // Veilige check voor album art (pakt middelgrote afbeelding indien beschikbaar)
        albumArt: t.album.images?.[1]?.url || 'https://via.placeholder.com',
        previewUrl: t.preview_url 
      }))
    };

  } catch (error) {
    // Gebruik JSON.stringify om het volledige object zichtbaar te maken
    console.error("❌ Discovery Error Detail:", JSON.stringify(error, null, 2));
    
    // Specifieke check voor OpenAI errors
    if (error.response) {
      console.error("OpenAI Status:", error.response.status);
      console.error("OpenAI Data:", error.response.data);
    }
    
    // Gebruiksvriendelijke foutmeldingen op basis van de error-context
    return { 
      error: error.message.includes('401') ? "Je Spotify-sessie is verlopen. Log opnieuw in." : 
             error.message.includes('quota') ? "OpenAI budget is op." : 
             "Oeps! Er ging iets mis bij het zoeken. Probeer het nog eens."
    };
  }
};

/**
 * Maakt een nieuwe playlist aan in het account van de gebruiker en voegt tracks toe.
 * @param {string} name - De gewenste naam van de playlist.
 * @param {Array} trackUris - Lijst met Spotify track URI's.
 */
export const createSpotifyPlaylist = async (name, trackUris) => {
  try {
    // Playlist aanmaken
    const playlistData = await spotifyApi.createPlaylist(name, { 
      'description': 'Gemaakt door mijn AI Discovery App', 
      'public': true 
    });
    
    const playlistId = playlistData.body.id;

    // Nummers toevoegen aan de nieuwe playlist
    await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
    
    // Geef de link naar de nieuwe playlist terug
    return playlistData.body.external_urls.spotify;
  } catch (error) {
    console.error("❌ Playlist aanmaken mislukt:", error.message);
    throw error;
  }
};