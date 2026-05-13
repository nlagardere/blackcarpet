const SB_URL = 'https://rfwcrqupdnxbxhxvdgsy.supabase.co';
const SB_KEY = 'sb_publishable_1Whjfp9-lqJzkXqDn3nlGA_jVOvHV75';

const sb = window.supabase.createClient(SB_URL, SB_KEY);

let role = "musician";
let score = 1000;

let chan;
let gameLoop;

let frozen = false;
let ended = false;

let saboteurName = "";

// --------------------
// CONNEXION
// --------------------

document.getElementById('joinBtn').onclick = async () => {

    const rId = document.getElementById('roomInput').value.trim();
    const nick = document.getElementById('nick').value.trim();

    if (!rId || !nick) {
        return alert("Pseudo + code requis !");
    }

    document.getElementById('joinBtn').style.display = 'none';

    document.getElementById('waitZone').style.display = 'block';

    chan = sb.channel('room-' + rId)

    // START
    .on('broadcast', { event: 'start' }, payload => {

        begin(payload.payload.boss);

    })

    // ATTAQUES
    .on('broadcast', { event: 'atk' }, payload => {

        const atk = payload.payload.type;

        if (atk === "burn") burn();

        if (atk === "blackout") blackout();

        if (atk === "freeze") freeze();

    })

    .subscribe((status) => {

        console.log("STATUS :", status);

    });

};

// --------------------
// START GAME
// --------------------

document.getElementById('startBtn').onclick = () => {

    role = "saboteur";

    const myNick = document.getElementById('nick').value;

    chan.send({

        type: 'broadcast',

        event: 'start',

        payload: {
            boss: myNick
        }

    });

    begin(myNick);

};

function begin(bossName) {

    // on sauvegarde le nom du saboteur
    saboteurName = bossName;

    ended = false;

    frozen = false;

    score = 1000;

    refresh();

    document.getElementById('lobby').style.display = 'none';

    document.getElementById('ui').style.display = 'flex';

    document.getElementById('game').style.display = 'block';

    const logo = document.getElementById('logo');

    // rôle affiché
    if (role === "saboteur") {

        logo.style.color = "red";

        logo.innerText = "SABOTEUR 😈";

    } else {

        logo.style.color = "white";

        logo.innerText = "HELLBAND 🎸";

        console.log("Le saboteur est :", bossName);

    }

    clearInterval(gameLoop);

    gameLoop = setInterval(spawn, 800);

}

// --------------------
// SABOTAGE
// --------------------

document.getElementById('logo').onclick = () => {

    if (role !== "saboteur") return;

    if (ended) return;

    const attacks = [

        "burn",

        "blackout",

        "freeze"

    ];

    const randomAtk =
        attacks[Math.floor(Math.random() * attacks.length)];

    chan.send({

        type: 'broadcast',

        event: 'atk',

        payload: {
            type: randomAtk
        }

    });

};

// --------------------
// EFFETS
// --------------------

function burn() {

    if (ended) return;

    document.body.style.filter = "invert(1)";

    if (navigator.vibrate) {
        navigator.vibrate(300);
    }

    score -= 50;

    refresh();

    setTimeout(() => {

        document.body.style.filter = "";

    }, 200);

}

function blackout() {

    if (ended) return;

    const flash = document.createElement("div");

    flash.style = `
        position:fixed;
        inset:0;
        background:black;
        z-index:9999;
    `;

    document.body.appendChild(flash);

    if (navigator.vibrate) {
        navigator.vibrate([200,100,200]);
    }

    score -= 70;

    refresh();

    setTimeout(() => {

        flash.remove();

    }, 1000);

}

function freeze() {

    if (ended) return;

    frozen = true;

    document.body.style.filter = "grayscale(100%)";

    if (navigator.vibrate) {
        navigator.vibrate([300,100,300]);
    }

    score -= 40;

    refresh();

    setTimeout(() => {

        frozen = false;

        document.body.style.filter = "";

    }, 2000);

}

// --------------------
// NOTES
// --------------------

function spawn() {

    if (ended) return;

    const game = document.getElementById('game');

    const n = document.createElement('div');

    n.style = `
        position:absolute;

        left:${Math.random()*80}vw;

        top:${Math.random()*70}vh;

        width:55px;
        height:55px;

        display:flex;
        justify-content:center;
        align-items:center;

        background:red;

        border-radius:50%;

        cursor:pointer;

        box-shadow:0 0 15px red;

        transition:0.15s;

        font-size:28px;
    `;

    n.innerHTML = "🎵";

    // clic
    n.onclick = (e) => {

        e.stopPropagation();

        if (frozen) return;

        if (ended) return;

        score += 20;

        n.style.transform = "scale(1.5)";

        n.style.opacity = "0";

        setTimeout(() => {

            n.remove();

        }, 150);

        refresh();

    };

    game.appendChild(n);

    // pénalité si raté
    setTimeout(() => {

        if (n.parentNode) {

            n.remove();

            score -= 30;

            refresh();

        }

    }, 1100);

}

// --------------------
// UI
// --------------------

function refresh() {

    // minimum 0
    if (score < 0) {

        score = 0;

    }

    document.getElementById('score').innerText = score;

    // --------------------
    // DÉFAITE MUSICIENS
    // --------------------

    if (

        role === "musician"
        &&
        score <= 0
        &&
        ended === false

    ) {

        ended = true;

        clearInterval(gameLoop);

        document.getElementById('game').innerHTML = "";

        alert(
            "GAME OVER 😈\n\n" +
            "Le saboteur a gagné !\n\n" +
            "Le saboteur était : " +
            saboteurName
        );

        document.getElementById('ui').style.display = 'none';

        document.getElementById('lobby').style.display = 'flex';

        document.getElementById('waitZone').style.display = 'none';

    }

    // --------------------
    // VICTOIRE MUSICIENS
    // --------------------

    if (

        role === "musician"
        &&
        score >= 3000
        &&
        ended === false

    ) {

        ended = true;

        clearInterval(gameLoop);

        document.getElementById('game').innerHTML = "";

        alert(
            "HELLBAND A GAGNÉ 🎸\n\n" +
            "Le saboteur était : " +
            saboteurName
        );

    }

}