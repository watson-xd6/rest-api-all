const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const app = express();
const dbFile = path.join(__dirname, "database.json");

function loadDB() {
    if (!fs.existsSync(dbFile)) {
        fs.writeFileSync(dbFile, JSON.stringify({ bannedIPs: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(dbFile));
}

function saveDB(data) {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

app.use((req, res, next) => {
    const db = loadDB();
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
    if (db.bannedIPs[ip] && Date.now() < db.bannedIPs[ip]) {
        return res.status(403).json({ error: "Akses diblokir karena spam." });
    } else if (db.bannedIPs[ip]) {
        delete db.bannedIPs[ip];
        saveDB(db);
    }
    next();
});

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    handler: (req, res, next) => {
        const db = loadDB();
        const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
        db.bannedIPs[ip] = Date.now() + 60 * 60 * 1000;
        saveDB(db);
        res.status(429).json({ error: "Terlalu banyak permintaan. IP Anda telah diblokir selama 1 jam." });
    },
    keyGenerator: (req) => {
        return req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
    },
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