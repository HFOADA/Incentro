import spotifyApi, { authenticateSpotify } from '../config/spotifyClient.js';

async function testConnection() {
  console.log("🚀 Test gestart...");

  try {
    await authenticateSpotify();
    
    // We testen nu direct een zoekopdracht, dat is betrouwbaarder
    const data = await spotifyApi.searchTracks('track:Thriller artist:Michael Jackson');
    const track = data.body.tracks.items[0];

    if (track) {
      console.log("✅ Succes! Verbinding met Spotify is 100% in orde.");
      console.log(`🎵 Test-track gevonden: ${track.name} door ${track.artists[0].name}`);
    } else {
      console.log("⚠️ Verbinding werkt, maar kon geen test-track vinden.");
    }

  } catch (error) {
    console.error("❌ Er ging iets mis:");
    // Dit zorgt ervoor dat we de échte foutmelding zien in plaats van [object Object]
    console.log(JSON.stringify(error, null, 2));
  }
}

testConnection();