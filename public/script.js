/**
 * Globale variabelen voor de applicatiestaat
 */
let currentTrackUris = []; // Houdt de Spotify URI's vast voor de huidige playlist-generatie
let currentAudio = null;   // Het actieve Audio object voor fragment-previews
let currentBtn = null;     // De knop die momenteel de 'playing' status heeft

/**
 * Controleert bij Spotify of er een actieve sessie is.
 * Past de interface aan op basis van de inlogstatus.
 */
async function checkAuth() {
    try {
        const res = await fetch('/api/auth-status');
        const data = await res.json();
        
        const authSection = document.getElementById('auth-section');
        const searchSection = document.getElementById('search-section');

        // Wisselen tussen inlogscherm en zoekmachine
        if (data.isAuthenticated) {
            authSection.style.display = 'none';
            searchSection.style.display = 'block';
        } else {
            authSection.style.display = 'block';
            searchSection.style.display = 'none';
        }
    } catch (err) {
        console.error("❌ Auth check mislukt:", err);
    }
}

/**
 * Regelt de Audio Preview functionaliteit (30-seconden fragmenten).
 * @param {string} url - De URL van het audiofragment.
 * @param {HTMLElement} btn - De knop waarop geklikt is.
 */
function togglePreview(url, btn) {
    // 1. Als hetzelfde nummer opnieuw wordt aangeklikt: Play/Pause toggelen
    if (currentAudio && currentAudio.src === url) {
        if (currentAudio.paused) {
            currentAudio.play();
            btn.innerHTML = "⏸";
            btn.classList.add('playing');
        } else {
            currentAudio.pause();
            btn.innerHTML = "▶";
            btn.classList.remove('playing');
        }
        return;
    }

    // 2. Als er al iets anders speelt: Stop dat nummer en reset de knop
    if (currentAudio) {
        currentAudio.pause();
        currentBtn.innerHTML = "▶";
        currentBtn.classList.remove('playing');
    }

    // 3. Nieuw audio object aanmaken en afspelen
    currentAudio = new Audio(url);
    currentBtn = btn;
    currentAudio.play();
    btn.innerHTML = "⏸";
    btn.classList.add('playing');

    // Reset de knop automatisch als het fragment is afgelopen
    currentAudio.onended = () => {
        btn.innerHTML = "▶";
        btn.classList.remove('playing');
    };
}

/**
 * Voegt een bericht toe aan de chat. 
 * Behoudt alle originele rendering-logica (albumhoezen, previews, tags).
 * @param {string} text - De tekst van het bericht.
 * @param {string} type - 'user' of 'ai'.
 * @param {object} data - Optionele muziekdata van Spotify.
 */
function appendMessage(type, data = null, text = "") {
    const chatMessages = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}-message`;

    if (type === 'user') {
        msgDiv.innerText = text;
    } else if (type === 'ai' && data) {
        // Hier gebruiken we de exacte rendering-logica die je al had:
        let html = `
            <div class="ai-header">
                <span class="main-genre">✨ ${data.mainGenre || 'Ontdekking'} Focus</span>
                <p style="font-size: 1.1em; margin: 10px 0;">"${data.explanation}"</p>
                <div class="tag-container">
                    ${(data.tags || []).map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
                ${data.tracks && data.tracks.length > 0 ? 
                    `<button class="button" onclick="savePlaylist()" style="background: white; color: black; margin-bottom: 25px;">💾 Bewaar als Playlist</button>` : 
                    ''
                }
            </div>
        `;

        html += data.tracks.map(t => `
            <div class="track">
                <img src="${t.albumArt}" alt="Album cover" onerror="this.src='https://via.placeholder.com'">
                <div class="track-info">
                    <strong>${t.name}</strong><br><small>${t.artist}</small>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    ${t.previewUrl ? 
                        `<button class="preview-btn" onclick="togglePreview('${t.previewUrl}', this)">▶</button>` : 
                        `<button class="preview-btn" disabled title="Geen preview beschikbaar">✕</button>`
                    }
                    <a href="${t.spotifyUrl}" target="_blank" class="button" style="padding: 5px 12px; font-size: 11px;">Spotify</a>
                </div>
            </div>
        `).join('');

        msgDiv.innerHTML = html;
    } else if (type === 'error') {
        // De originele error-card styling
        msgDiv.innerHTML = `
            <div class="error-card">
                <h3>⚠️ Oeps!</h3>
                <p>${text}</p>
                <button class="retry-btn" onclick="document.getElementById('userInput').focus()">Probeer iets anders</button>
            </div>`;
    }

    chatMessages.appendChild(msgDiv);
    
    // Scroll naar het nieuwste bericht
    const container = document.getElementById('chat-container');
    container.scrollTop = container.scrollHeight;
}

/**
 * De hoofd-zoekfunctie: stuurt de gebruikersvraag naar de server 
 * en rendert de AI-respons en Spotify tracks.
 */
async function search() {
    const inputField = document.getElementById('userInput');
    const userPrompt = inputField.value;
    if (!userPrompt) return;

    // 1. Toon direct de vraag van de gebruiker
    appendMessage('user', null, userPrompt);
    inputField.value = "";

    // 2. Maak een unieke ID voor de 'Typing' indicator
    const loadingId = "typing-" + Date.now();
    const chatMessages = document.getElementById('chat-messages');
    
    // Voeg de typ-animatie toe aan de chat
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = "message ai-message";
    loadingDiv.innerHTML = `
        <div class="typing">
            <span></span><span></span><span></span>
        </div>
        <small style="color: #b3b3b3;">Je vibe analyseren...</small>
    `;
    chatMessages.appendChild(loadingDiv);
    
    // Scroll naar beneden voor de lader
    document.getElementById('chat-container').scrollTop = document.getElementById('chat-container').scrollHeight;

    try {
        const res = await fetch('/api/discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userPrompt })
        });

        const data = await res.json();

        // 3. Verwijder de typing indicator voordat het echte antwoord komt
        const indicator = document.getElementById(loadingId);
        if (indicator) indicator.remove();

        if (data.error) {
            appendMessage('error', null, data.error);
            return;
        }

        currentTrackUris = data.tracks.map(t => t.uri);
        appendMessage('ai', data);

    } catch (err) {
        console.error("❌ Fout tijdens het zoeken:", err);
        const indicator = document.getElementById(loadingId);
        if (indicator) indicator.remove();
        appendMessage('error', null, "De verbinding met de AI-curator is verbroken.");
    }
}

/**
 * Maakt een fysieke playlist aan in het Spotify account van de gebruiker.
 */
async function savePlaylist() {
    const playlistName = prompt("Hoe moet de playlist heten?", "Mijn AI Ontdekking");
    if (!playlistName || currentTrackUris.length === 0) return;

    try {
        const res = await fetch('/api/create-playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: playlistName, trackUris: currentTrackUris })
        });

        const data = await res.json();
        if (data.success) {
            alert("Playlist succesvol aangemaakt!");
            window.open(data.url, '_blank');
        }
    } catch (err) {
        console.error("❌ Playlist aanmaken mislukt:", err);
        alert("Kon de playlist niet opslaan.");
    }
}

/**
 * Reset de chatgeschiedenis op de server en ververs de UI.
 */
async function resetChat() {
    try {
        const res = await fetch('/api/reset', { method: 'POST' });
        const data = await res.json();
        
        if (data.success) {
            // 1. Maak de hele chat-container leeg
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML = "";

            // 2. Wis de invoer en de opgeslagen track-data
            document.getElementById('userInput').value = "";
            currentTrackUris = [];

            // 3. Toon een bevestigingsbericht van de AI in de schone chat
            appendMessage('ai', {
                mainGenre: 'Systeem',
                explanation: 'De chatgeschiedenis is gereset. Waar heb je nu zin in?',
                tags: ['SchoneLei', 'NieuweVibe'],
                tracks: [] // Geen tracks bij dit bericht
            });

            console.log("🧹 Chatgeschiedenis op de server en UI gereset.");
        }
    } catch (err) {
        console.error("❌ Chat reset mislukt:", err);
    }
}

/**
 * Event Listeners
 */
document.getElementById('userInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') search();
});

// Initialisatie: check de login status bij het laden van de pagina
checkAuth();