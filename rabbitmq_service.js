// This service encapsulates the RabbitMQ connection and publishing logic.
const amqp = require('amqplib');

// --- CONFIGURATION ---
// IMPORTANT: Replace with your actual RabbitMQ server details.
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost'; 
const EXCHANGE_NAME = 'aeriez_alart_exchange';
const EXCHANGE_TYPE = 'topic';

let connection = null;
let channel = null;

/**
 * Connects to the RabbitMQ server and creates a channel and exchange.
 * Implements a retry mechanism for robustness.
 */
async function connectToRabbitMQ() {
    try {
        console.log('Connecting to RabbitMQ...');
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        
        // Assert the exchange exists, creating it if it doesn't.
        // The 'durable' option ensures the exchange survives broker restarts.
        await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

        console.log('Successfully connected to RabbitMQ and exchange is ready.');

        // Handle connection closure
        connection.on('close', () => {
            console.error('RabbitMQ connection closed. Reconnecting...');
            setTimeout(connectToRabbitMQ, 5000); // Reconnect after 5 seconds
        });
        
        connection.on('error', (err) => {
            console.error('RabbitMQ connection error:', err.message);
        });

    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error.message);
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectToRabbitMQ, 5000);
    }
}

/**
 * Publishes a message to a specific topic on the configured exchange.
 * 
 * @param {string} topic The routing key (e.g., 'company.acme.user.user123')
 * @param {object} message The message payload to be sent.
 * @returns {boolean} True if publish was successful, false otherwise.
 */
async function publishMessage(topic, message) {
    if (!channel) {
        console.error('Cannot publish message: RabbitMQ channel is not available.');
        return false;
    }

    try {
        const payload = Buffer.from(JSON.stringify(message));
        
        // Publish the message to the exchange with the given topic.
        // The 'persistent' delivery mode ensures messages survive a broker restart.
        channel.publish(EXCHANGE_NAME, topic, payload, { persistent: true });
        
        console.log(`[x] Sent to topic '${topic}': '${JSON.stringify(message)}'`);
        return true;
    } catch (error) {
        console.error('Failed to publish message:', error.message);
        return false;
    }
}

module.exports = {
    connectToRabbitMQ,
    publishMessage,
};
