const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const app = express();
const dbFile = path.join(__dirname, "database.json");

function loadDB() {
    if (!fs.existsSync(dbFile)) {
        fs.writeFileSync(dbFile, JSON.stringify({ bannedIPs: {}, requestCounts: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(dbFile));
}

function saveDB(data) {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

app.use((req, res, next) => {
    const db = loadDB();
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;

    if (db.bannedIPs[ip]) {
        return res.status(403).json({ error: "Akses Anda diblokir secara permanen karena spam." });
    }

    const now = Date.now();
    if (!db.requestCounts[ip]) db.requestCounts[ip] = [];

    db.requestCounts[ip].push(now);
    db.requestCounts[ip] = db.requestCounts[ip].filter(ts => now - ts <= 60 * 1000);

    if (db.requestCounts[ip].length > 50) {
        db.bannedIPs[ip] = true;
        delete db.requestCounts[ip];
        saveDB(db);
        return res.status(403).json({ error: "IP Anda diblokir karena terlalu banyak request." });
    }

    saveDB(db);
    next();
});

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: "Terlalu banyak permintaan, coba lagi dalam 1 menit." },
    keyGenerator: (req) => req.headers["x-forwarded-for"]?.split(",")[0] || req.ip,
    standardHeaders: true,
    legacyHeaders: false
});

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const routes = [
    "ytdl", "twitterdl", "igdl", "fbdl", "ttdl", "gitclone", "spotifydl", "githubstalk",
    "searchgroups", "ttsearch", "ytsearch", "npmsearch", "pinterest", "spotifysearch",
    "llama-3.3-70b-versatile", "gemini", "txt2img", "ssweb", "translate", "nulis", "cuaca",
    "qrcodegenerator", "vcc", "cekkhodam", "tahukahkamu", "brat", "qc", "detiknews", "kompasnews"
];

routes.forEach(route => {
    app.use(`/api/${route}`, limiter, require(`./api/${route}`));
});

module.exports = app;