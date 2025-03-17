const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

let totalRequests = 0;
let clients = [];

app.use((req, res, next) => {
    totalRequests++;
    sendUpdateToClients();
    next();
});

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/monitor-page", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "monitor", "monitor.html"));
});

app.get("/monitor", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ totalRequests })}\n\n`);
    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res,
    };
    clients.push(newClient);
    req.on("close", () => {
        clients = clients.filter((client) => client.id !== clientId);
    });
});

function sendUpdateToClients() {
    clients.forEach((client) => {
        client.res.write(`data: ${JSON.stringify({ totalRequests })}\n\n`);
    });
}

const routes = ["ytdl", "igdl", "fbdl", "ttdl", "githubstalk", "searchgroups", "llama-3.3-70b-versatile"];
routes.forEach((route) => {
    app.use(`/api/${route}`, require(`./api/${route}`));
});

module.exports = app;