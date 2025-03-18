const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/", require("./monitor"));

const routes = ["ytdl", "igdl", "fbdl", "ttdl", "githubstalk", "searchgroups", "llama-3.3-70b-versatile", "ssweb"];
routes.forEach(route => {
    app.use(`/api/${route}`, require(`./api/${route}`));
});

module.exports = app

