import express from 'express';
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js';
import musicRoutes from './routes/musicRoutes.js';
import cors from 'cors';

console.log("Check: debugger start hier");

/**
 * Initialisatie van de Express applicatie
 */
const app = express();

app.use(cors());

/**
 * Middleware configuratie
 */
// Zorgt ervoor dat de server JSON data in POST-verzoeken kan begrijpen
app.use(express.json());

// Serveert statische bestanden (HTML, CSS, JS) vanuit de 'public' map
app.use(express.static('public'));

/**
 * Route Definities
 */
// Routes voor Spotify authenticatie (Login, Callback, Auth-status)
app.use('/', authRoutes);

// Routes voor de AI-logica en Spotify data-verzoeken
app.use('/api', musicRoutes);

/**
 * Server Starten
 * Gebruikt de poort uit .env, of valt terug op 3000 als deze niet is ingesteld.
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server succesvol opgestart op http://127.0.0.1:${PORT}`);
  console.log('💡 Gebruik Ctrl+C om de server te stoppen.');
});

export default app; // Voor eventuele latere testen