const sb = window.supabase.createClient(
    'https://rfwcrqupdnxbxhxvdgsy.supabase.co',
    'sb_publishable_1Whjfp9-lqJzkXqDn3nlGA_jVOvHV75'
);

let role = "agent";
let score = 1000;
let roomId = "";
let myNick = "";
let chan;
let ended = false;
let cooldown = false;
let paparazzi = "";

function show(id) {
    const screens = ['lobbyChoice', 'lobbyCreate', 'lobbyJoin', 'waitZone', 'ui', 'game', 'gameover'];
    screens.forEach(e => {
        const el = document.getElementById(e);
        if (el) el.classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
}

// Liaison des boutons au démarrage
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('goCreateBtn').onclick = () => show('lobbyCreate');
    document.getElementById('goJoinBtn').onclick = () => show('lobbyJoin');
    document.getElementById('backCreateBtn').onclick = () => show('lobbyChoice');
    document.getElementById('backJoinBtn').onclick = () => show('lobbyChoice');

    document.getElementById('createRoomBtn').onclick = () => {
        myNick = document.getElementById('nickCreate').value.trim();
        if (!myNick) return alert("Pseudo requis");
        roomId = Math.random().toString(36).slice(2, 6).toUpperCase();
        connect(true);
    };

    document.getElementById('joinRoomBtn').onclick = () => {
        myNick = document.getElementById('nickJoin').value.trim();
        roomId = document.getElementById('roomInput').value.trim().toUpperCase();
        if (!myNick || !roomId) return alert("Infos manquantes");
        connect(false);
    };

    document.getElementById('startBtn').onclick = () => {
        const list = Object.keys(chan.presenceState());
        paparazzi = list[Math.floor(Math.random() * list.length)];
        chan.send({ type: 'broadcast', event: 'start', payload: { paparazzi } });
        startGame(paparazzi);
    };

    document.getElementById('rumorBtn').onclick = () => {
        if (role !== "paparazzi" || cooldown) return;
        const types = ["FLASH", "RUMOR", "BLACKOUT", "GLITCH"];
        const type = types[Math.floor(Math.random() * types.length)];
        chan.send({ type: 'broadcast', event: 'leak', payload: { type } });
        cooldown = true;
        setTimeout(() => cooldown = false, 2500);
    };
});

function connect(isHost) {
    show('waitZone');
    document.getElementById('roomCode').textContent = roomId;

    chan = sb.channel('room-' + roomId, {
        config: { presence: { key: myNick } }
    });

    chan.on('presence', { event: 'sync' }, () => {
        const p = Object.keys(chan.presenceState());
        document.getElementById('playerList').innerHTML = p.map(x => `<div>• ${x}</div>`).join('');
        document.getElementById('playerCount').textContent = p.length + " joueurs";
    });

    chan.on('broadcast', { event: 'start' }, p => startGame(p.payload.paparazzi));
    chan.on('broadcast', { event: 'leak' }, p => receiveLeak(p.payload.type));

    chan.subscribe(async s => {
        if (s === 'SUBSCRIBED') {
            await chan.track({ nick: myNick });
            if (isHost) document.getElementById('startBtn').classList.remove('hidden');
        }
    });
}

function startGame(pap) {
    paparazzi = pap;
    role = (pap === myNick) ? "paparazzi" : "agent";
    score = 1000;
    ended = false;

    show('ui');
    document.getElementById('game').classList.remove('hidden');
    document.getElementById('roleHint').textContent = role.toUpperCase();

    if (role === "paparazzi") {
        document.getElementById('rumorBtn').classList.remove('hidden');
    }

    const gameInterval = setInterval(() => {
        if (ended) {
            clearInterval(gameInterval);
            return;
        }
        spawnLeak();
    }, 900);
}

function spawnLeak() {
    if (ended) return;
    const items = ["PHOTO", "RUMOR", "DM", "CLIP"];
    const el = document.createElement('div');
    el.className = 'note';
    el.textContent = items[Math.floor(Math.random() * items.length)];
    el.style.left = Math.random() * 80 + "vw";
    el.style.top = Math.random() * 70 + "vh";

    el.onclick = (e) => {
        e.stopPropagation();
        score += 20;
        updateUI();
        el.remove();
    };

    document.getElementById('game').appendChild(el);

    setTimeout(() => {
        if (el.parentNode) {
            el.remove();
            score -= 35;
            updateUI();
        }
    }, 1300);
}

function receiveLeak(type) {
    const el = document.createElement('div');
    el.className = 'note big';
    el.textContent = "⚠ " + type;
    el.style.left = Math.random() * 70 + "vw";
    el.style.top = Math.random() * 60 + "vh";
    document.getElementById('game').appendChild(el);

    if (type === "BLACKOUT") {
        document.body.style.filter = "brightness(0)";
        setTimeout(() => document.body.style.filter = "none", 1200);
    }
    if (type === "GLITCH") {
        document.body.style.transform = "skewX(15deg)";
        setTimeout(() => document.body.style.transform = "none", 1000);
    }
    if (type === "FLASH") score -= 60;
    if (type === "RUMOR") score -= 40;

    updateUI();
    setTimeout(() => el.remove(), 1500);
}

function updateUI() {
    document.getElementById('score').textContent = score;
    // La barre se vide si le score baisse (base 1000)
    document.getElementById('scoreBar').style.width = Math.max(0, Math.min(100, score / 10)) + "%";

    if (score <= 0 && !ended && role === "agent") {
        ended = true;
        show('gameover');
        document.getElementById('resSub').textContent = "Le Paparazzi a gagné. Votre carrière est terminée.";
    }
    if (score <= 0 && !ended && role === "paparazzi") {
        ended = true;
        show('gameover');
        document.getElementById('resSub').textContent = "Les agents ont gagné. Votre réputation est ruinée.";
    }
}