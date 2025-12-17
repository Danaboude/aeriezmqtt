const express = require('express');
const mqtt = require('mqtt');
const path = require('path');

const app = express();
const port = 3000;

// --- MQTT Setup ---
const brokerUrl = 'mqtt://broker.hivemq.com';
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
    console.log('Connected to MQTT broker');
});

client.on('error', (error) => {
    console.error('MQTT connection error:', error);
});

// --- Express API ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle notification request
app.post('/notify', (req, res) => {
    const { topic, message: customMessage } = req.body;
    if (!topic) {
        return res.status(400).json({ success: false, message: 'Topic is required.' });
    }
    if (!customMessage) {
        return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const message = {
        title: 'New Notification',
        body: customMessage
    };

    const payload = JSON.stringify(message);

    client.publish(topic, payload, { qos: 1 }, (error) => {
        if (error) {
            console.error('MQTT publish error:', error);
            return res.status(500).json({ success: false, message: 'Failed to publish MQTT message.' });
        }
        console.log(`Published to ${topic}: ${payload}`);
        res.status(200).json({ success: true, message: 'Notification sent successfully!' });
    });
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});