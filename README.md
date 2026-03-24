# 🎵 AI-Powered Music Discovery Experience

Dit project is een **Proof-of-Concept (PoC)** voor een moderne manier van muziek ontdekken. In plaats van een traditionele zoekmachine met filters, maakt deze applicatie gebruik van **natuurlijke taal** en een **conversatie-interface** om op een slimme manier nieuwe muziek te vinden via de Spotify API en OpenAI.

## 🚀 Over het Project
De applicatie fungeert als een persoonlijke AI-muziekcurator. Gebruikers kunnen in hun eigen woorden omschrijven waar ze naar willen luisteren, waarna de AI de intentie, stemming en activiteit vertaalt naar specifieke muziekparameters.

### Belangrijkste Features:
- **Natural Language Processing**: Ontdek muziek op basis van context (bijv. "Geef me lekkere lo-fi om bij te studeren" of "Iets voor een regenachtige zondag").
- **Conversational UI**: De AI onthoudt de context van het gesprek. Je kunt vervolgvragen stellen zoals "Maak het iets energieker" of "Minder dromerig".
- **Spotify Integratie**: Directe koppeling voor het ophalen van tracks, 30-seconden fragmenten (audio previews) en het fysiek opslaan van de selectie als een nieuwe playlist.
- **Modern Interface**: Een responsive chat-interface met albumhoezen, genre-tags en een interactieve typing-animatie.

## 🧠 Gemaakte Keuzes
- **Architectuur**: Gebruik van een modulaire mappenstructuur (`/services`, `/routes`, `/config`) om de logica gescheiden en schaalbaar te houden.
- **AI Model (GPT-4o-mini)**: Gekozen vanwege de hoge snelheid en kostenefficiëntie. Het model is specifiek geprompt om gestructureerde JSON terug te geven voor de Spotify API.
- **Feb 2026 Proof**: De code is aangepast aan de nieuwste Spotify API-standaarden, waarbij tracks worden aangeroepen via de stabiele `/track/ID` structuur.
- **Security**: Gevoelige gegevens zoals API-keys worden strikt beheerd via omgevingsvariabelen (`.env`) en zijn niet hardcoded in de broncode.

## 🛠️ Installatie & Gebruik

### 1. Voorbereiding
Zorg dat je over de volgende zaken beschikt:
- Een **Spotify Developer** App (Client ID & Secret).
- Een **OpenAI API Key** (met voldoende saldo).
- De Redirect URI in het Spotify Dashboard ingesteld op: `http://127.0.0.1:3000`.

### 2. Omgevingsvariabelen
Maak een `.env` bestand aan in de hoofdmap van het project:
```env
SPOTIFY_CLIENT_ID=jouw_spotify_client_id
SPOTIFY_CLIENT_SECRET=jouw_spotify_client_secret
OPENAI_API_KEY=jouw_openai_sleutel
PORT=3000
```

### 3. Installatie
Installeer de benodigde Node.js packages via de terminal:
```bash
npm install
```

### 4. Draaien
Start de applicatie met het standaard script:
```bash
npm start
```

Voor ontwikkeling met automatische herstart bij wijzigingen:
```bash
npm run dev
```

Ga in je browser naar **`http://127.0.0.1:3000`**.

## 📁 Projectstructuur
- **/config**: Bevat `openaiClient.js` en `spotifyClient.js` met configuratie-checks.
- **/services**: Bevat `discoveryService.js` (de logica die AI-output vertaalt naar Spotify-data).
- **/routes**: Gescheiden API-routes voor authenticatie (`authRoutes.js`) en muziek (`musicRoutes.js`).
- **/public**: De frontend bestanden (`index.html`, `style.css` met animaties, `script.js`).
- **server.js**: Het centrale startpunt van de Express applicatie.
- **.env**: Configuratiebestand voor API-sleutels (niet in versiebeheer).

## 🛠️ Gebruikte Technologieën
- **Node.js & Express**: Backend server.
- **OpenAI SDK**: Voor de GPT-4o-mini integratie.
- **Spotify Web API Node**: Voor de communicatie met Spotify.