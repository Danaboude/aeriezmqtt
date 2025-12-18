const express = require('express');
const path = require('path');
const { connectToRabbitMQ, publishMessage } = require('./rabbitmq_service');
const { startPolling } = require('./daemon');

const app = express();
const port = 3000;

// --- Mock Data Store ---
// This is a simple in-memory flag to simulate if new tickets are available.
// In a real application, this would be a database check.
let MOCK_HAS_NEW_TICKETS = false;
setInterval(() => {
    MOCK_HAS_NEW_TICKETS = !MOCK_HAS_NEW_TICKETS;
    console.log(`[Mock API] New ticket status toggled to: ${MOCK_HAS_NEW_TICKETS}`);
}, 20000); // Toggles every 20 seconds for testing purposes.


// --- Express API ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle notification request from the web UI
app.post('/notify', async (req, res) => {
    // The topic from the web UI comes in as: company/acme/user/user123
    // We need to replace slashes with dots for RabbitMQ routing keys.
    const originalTopic = req.body.topic;
    const { message: customMessage } = req.body;

    if (!originalTopic) {
        return res.status(400).json({ success: false, message: 'Topic is required.' });
    }
    if (!customMessage) {
        return res.status(400).json({ success: false, message: 'Message is required.' });
    }
    
    // Convert topic to RabbitMQ routing key format
    const routingKey = originalTopic.replace(/\//g, '.');

    const message = {
        title: 'New Notification',
        body: customMessage
    };

    const published = await publishMessage(routingKey, message);

    if (published) {
        console.log(`Published to ${routingKey}: ${JSON.stringify(message)}`);
        res.status(200).json({ success: true, message: 'Notification sent successfully!' });
    } else {
        console.error('Failed to publish RabbitMQ message.');
        res.status(500).json({ success: false, message: 'Failed to publish RabbitMQ message.' });
    }
});


// --- MOCK API FOR DAEMON ---

// Step 1: Daemon calls this API to check if a tenant has new tickets.
app.get('/api/check-tickets', (req, res) => {
    const { tenant } = req.query;
    if (!tenant) {
        return res.status(400).json({ error: 'Tenant ID is required.' });
    }
    // In a real app, you'd query your database for this tenant.
    // Here, we just use our mock flag.
    res.json({ hasNewTickets: MOCK_HAS_NEW_TICKETS });
});

// Step 2: If the first API returns true, daemon calls this to get recipients.
app.get('/api/ticket-recipients', (req, res) => {
    const { tenant } = req.query;
    if (!tenant) {
        return res.status(400).json({ error: 'Tenant ID is required.' });
    }
    // This is a hardcoded list of recipients for the mock 'acme' tenant.
    // In a real app, you'd fetch these from a database based on the new tickets.
    res.json({
        recipients: [
            { type: 'user', id: 'user123' },
            { type: 'group', id: 'group-a' }
        ]
    });
});


// --- Start Server ---
app.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`);
    // Connect to RabbitMQ
    await connectToRabbitMQ();
    // Start the polling daemon
    startPolling();
});