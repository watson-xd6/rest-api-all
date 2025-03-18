const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://OwnBlox:ErylvJV8cJSqSPQo@cluster0.lizkx.mongodb.net/monitoring?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db, collection, clients = [];

client.connect().then(() => {
    db = client.db("monitoring");
    collection = db.collection("requests");
});

router.use(async (req, res, next) => {
    if (collection) await collection.updateOne({}, { $inc: { totalRequests: 1 } }, { upsert: true });
    sendUpdateToClients();
    next();
});

router.get("/monitor-page", (req, res) => {
    res.sendFile(__dirname + "/public/monitor/monitor.html");
});

router.get("/monitor", async (req, res) => {
    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    });
    res.flushHeaders();

    clients.push(res);
    const data = await collection.findOne({});
    res.write(`data: ${JSON.stringify({ totalRequests: data ? data.totalRequests : 0 })}\n\n`);

    req.on("close", () => {
        clients = clients.filter(c => c !== res);
    });
});

async function sendUpdateToClients() {
    const data = await collection.findOne({});
    clients.forEach(res => {
        res.write(`data: ${JSON.stringify({ totalRequests: data ? data.totalRequests : 0 })}\n\n`);
    });
}

module.exports = router;