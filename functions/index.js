const functions = require('firebase-functions');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { webhook } = require('./webhook');
const { processMessages } = require('./processMessage');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins (use specific domains in production)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json());

// Webhook route
app.post('/api/webhook', webhook);

// Health check route
app.get("/api", (req, res) => {
    return res.status(200).send("Roi API is working!");
});

// Export Firebase HTTPS function
exports.api = functions.https.onRequest(app);

// Export processMessage function (if used in other Firebase triggers)
exports.processMessage = processMessages;
