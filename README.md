
# 🛡️ Village Defense

**Village Defense** is a game that leverages chat interaction during a Twitch live stream, allowing viewers to send a series of commands that make their avatars perform various actions.

---

## 🎯 Game Objective

Four races of **wood-eating monsters** attack the **wooden fort** at the center of the village at different times, driven by their need to survive. But the fort’s presence is **vital** for the villagers. Their goal is to **defend it at all costs**!  

To do this, they must show courage, **arm themselves**, and **fight** to defeat the monsters.  
There is **no diplomacy** with monsters!

If a monster reaches the fort and starts attacking it, it’s not something to celebrate — but it’s also not the end... yet.  
Above the fort, a **counter** displays how much longer it can hold. Only when the counter reaches zero is the village **doomed** and the match ends!

The player who has managed their time in the village best — **killing the most monsters**, **being present the longest**, **maintaining high health**, and **leveling up** faster — will reach the **top of the leaderboard** and **restart at a higher level** in the next match.  

For all others, unfortunately, it means **starting again from level one**. But fear not — they might catch up faster than expected!

---

## ⚙️ How It Works

The client accesses the game at **http://localhost:5173** via browser (a Vite development server serving the HTML/JS/CSS).  

When the client creates a WebSocket connection using `io()` (on `/socket.io`), Vite intercepts the request and forwards it to **http://localhost:3001** to avoid CORS issues.  

Once the connection is established, the client and the backend (running on port 3001) communicate **directly via WebSocket** — messages no longer pass through the Vite server, which was only needed to initiate the connection.  

The server on port 3001 connects to Twitch chat as a client using **tmi.js**.

> **Fun fact**:  
> “tmi.js” is an unofficial Node.js client library that allows a bot or user to connect to Twitch chat in real time.  
> “TMI” stands for **Twitch Messaging Interface**, the protocol Twitch uses for its chat (based on IRC).  
> So “tmi.js” handles this protocol and makes chat interaction very easy.

The server receives in real time all **channel usernames** and their **chat messages**, and sends this information to the client, which processes it accordingly.

---

## 🛠 Technologies Used

- **Frontend**: HTML, CSS, JavaScript (Phaser framework)  
- **Backend**: Node.js, Vite, Socket.IO

---

## 🔧 Installation

### 1. Create a Twitch App and Get Your Token

Follow these steps once:

**a)** Register your app at [https://dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps)  
- **Name**: choose any (e.g., `VillageDefenseBot`)  
- **Redirect URI**: `http://localhost`  
- Save the **Client ID** and **Client Secret**

**b)** Use this link to authenticate and get your token (replace `YOUR_CLIENT_ID`):

```
https://id.twitch.tv/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost&response_type=token&scope=chat:read+chat:edit
```

Log in with your Twitch account and copy the `access_token` from the redirect URL (`access_token=xyz...`).

**c)** Hide your access token in your project:

Create a `.env` file with the following content (replace `YOUR_OAUTH_CODE`):

```
TWITCH_OAUTH=oauth:YOUR_OAUTH_CODE
```

Add `.env` to your `.gitignore` file to prevent it from being committed:

```
.env
```

**d)** Edit `server.mjs` with your Twitch channel name (lowercase) and your token:

```js
const twitchClient = new tmi.Client({
  identity: {
    username: 'joshgiosu',
    password: process.env.TWITCH_OAUTH
  },
  channels: ['joshgiosu']
});
```

---

## 📥 Clone the Repository

```bash
git clone https://github.com/UniCT-WebDevelopment/VillageDefense
cd VillageDefense
```

Install the required dependencies:

```bash
npm install vite dotenv express phaser socket.io socket.io-client tmi.js
```

---

## ▶️ Launch the Game

Open **two terminal tabs/windows**, and run:

```bash
npm run dev
```

```bash
npm run server
```

Then open your browser and go to:  
👉 **http://localhost:5173**
