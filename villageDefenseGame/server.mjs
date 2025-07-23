// server.mjs o server.js (con "type": "module")
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import tmi from 'tmi.js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use('/src', express.static('src'));
app.use('/assets', express.static('public/assets'));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/index.html'); // serve l'index dalla root
});



const spettatori = new Map(); //Associazione tra username e timestamp d'ingresso

const twitchClient = new tmi.Client({
  identity: {
    username: 'joshgiosu',
    password: process.env.TWITCH_OAUTH

  },
  channels: ['joshgiosu']
});


twitchClient.connect().catch(console.error);

twitchClient.on('message', (channel, tags, message, self) => {
  if (self) return;

  const comando = message.trim().toLowerCase();
  if (!spettatori.has(tags.username)) {
    spettatori.set(tags.username, {
      joinedAt: Date.now()

    });
  }

  console.log(`Canale ricevuto: ${tags.username} Comando ricevuto: ${comando} `);
  io.emit('comando', { channel: tags.username, comando });
});

setInterval(() => {
  const now = Date.now();

  for (const [username, data] of spettatori.entries()) {
    const secondsElapsed = Math.floor((now - data.joinedAt) / 1000);
    //Notifica tempo trascorso normalmente
    io.emit('tempoTrascorso', { channel: username, secondsElapsed });
  }
}, 1000);

//Invia un messaggio in chat ogni 120 secondi con le istruzioni del gioco
setInterval(() => {
  const text = `🎮 GAME OBJECTIVE 🎮
➡️ Defend the WOODEN FORT from enemies!
➡️ Level up and earn ATTACK and DEFENSE points!

📜 AVAILABLE COMMANDS:
👤 !playMan / !playWoman → Join the game
🌱 !seeding → Plant trees to earn defense points (⚠️ if no seeds appear, tree limit reached)
🪓 !gathering → Collect wood from trees to earn attack points
⚔️ !attack → Attack the enemies
🏰 !enterFort → Enter the fort and stop any activity

🎲 BETTING COMMANDS:
❤️ !betForLife → Bet defense to fully restore health
⚡ !betForLevel → Bet attack to level up
🥊 !betAgainstAvatar → From level 3, challenge another avatar

📈 HOW TO LEVEL UP:
- Seeding = DEFENSE points
- Gathering or killing enemies = ATTACK points
- Or win a bet with !betForLevel

📌 POINT SYSTEM:
Attack/Defense points accumulate over 2 levels.
On the 3rd level: they reset. Then start over!

🎯 CHANCES TO WIN !betAgainstAvatar:
10 level gap → 50% (Win: +3/-3, Lose: -2)
9–8 → 40% (Win: +2/-2, Lose: -2)
7 → 30% (Win: +2/-2, Lose: -2)
6 → 20% (Win: +3/-2, Lose: -2)
5 → 10% (Win: +4/-3, Lose: -2)

📊 In each bet, the CHALLENGED avatar is the one who has been active the longest!
`;

  twitchClient.say('joshgiosu', text)
    .then(() => console.log(`[BOT] Messaggio inviato: "${text}"`))
    .catch(err => console.error('[BOT] Errore nell\'invio del messaggio:', err));
}, 120000);

//Invia una comunicazione al giocatore quando si trova a dover ricaricare i punti di attacco e difesa
io.on("connection", socket => {
  socket.on("recharge", msg => {
    twitchClient.say('joshgiosu', msg)
      .then(() => console.log(`[BOT] Messaggio inviato: "${msg}"`))
      .catch(err => console.error('[BOT] Errore nell\'invio del messaggio:', err));
  });

  socket.on("betForLifeDisclaimer", msg => {
    twitchClient.say('joshgiosu', msg)
      .then(() => console.log(`[BOT] Messaggio inviato: "${msg}"`))
      .catch(err => console.error('[BOT] Errore nell\'invio del messaggio:', err));
  });

  socket.on("betForLevelDisclaimer", msg => {
    twitchClient.say('joshgiosu', msg)
      .then(() => console.log(`[BOT] Messaggio inviato: "${msg}"`))
      .catch(err => console.error('[BOT] Errore nell\'invio del messaggio:', err));
  });

  socket.on("setDisclaimer", msg => {
    twitchClient.say('joshgiosu', msg)
      .then(() => console.log(`[BOT] Messaggio inviato: "${msg}"`))
      .catch(err => console.error('[BOT] Errore nell\'invio del messaggio:', err));
  });

});





server.listen(3001, () => {
  console.log('Server Socket.io avviato su http://localhost:3001');
});

