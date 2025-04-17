const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");

const app = express();

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: "Terlalu banyak permintaan, coba lagi nanti." },
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
    "ytdl", "twitterdl", "igdl", "fbdl", "ttdl", "gitclone", "spotifydl",
    "githubstalk", "searchgroups", "randommeme", "ttsearch", "ytsearch", "npmsearch", "googlesearch", "duckduckgo",
    "pinterest", "spotifysearch", "gistalk", "llama-3.3-70b-versatile", "gemini",
    "txt2img", "genshinbuild", "ssweb", "translate", "nulis", "cuaca", "qrcodegenerator",
    "vcc", "cekkhodam", "tahukahkamu", "brat", "qc", "detiknews", "kompasnews"
];

routes.forEach(route => {
    app.use(`/api/${route}`, limiter, require(`./api/${route}`));
});

module.exports = app;