import OpenAI from 'openai';
import 'dotenv/config';

/**
 * Validatie: Controleer direct bij het opstarten of de API-key aanwezig is.
 * Dit voorkomt dat de app later crasht met onduidelijke foutmeldingen.
 */
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Fout: OPENAI_API_KEY ontbreekt in je .env bestand!");
  process.exit(1); // Stop de applicatie als de configuratie niet klopt
}

/**
 * Initialisatie van de OpenAI SDK.
 * De API-key wordt veilig uit de omgevingsvariabelen geladen.
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Exporteer de geconfigureerde instantie zodat deze 
 * overal in de applicatie (zoals in discoveryService.js) herbruikbaar is.
 */
export default openai;