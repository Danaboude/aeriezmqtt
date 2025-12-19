// This service encapsulates the RabbitMQ connection and publishing logic using native MQTT.
// We switched from AMQP (amqplib) to MQTT (mqtt.js) to ensure 100% compatibility with the mobile client.
const mqtt = require('mqtt');

// --- CONFIGURATION ---
// IMPORTANT: Connect to the MQTT port (1883), NOT the AMQP port (5672).
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://guest:guest@localhost:1883';

let client = null;

/**
 * Connects to the RabbitMQ server via MQTT.
 */
async function connectToRabbitMQ() {
    return new Promise((resolve, reject) => {
        console.log(`Connecting to MQTT Broker at ${MQTT_BROKER_URL}...`);

        client = mqtt.connect(MQTT_BROKER_URL, {
            clientId: 'backend_daemon_' + Math.random().toString(16).substr(2, 8),
            clean: true, // Clean session
            connectTimeout: 4000,
            reconnectPeriod: 5000,
        });

        client.on('connect', () => {
            console.log('Successfully connected to RabbitMQ (MQTT).');
            resolve(client);
        });

        client.on('error', (err) => {
            console.error('MQTT Connection Error:', err.message);
            // Don't reject immediatly to allow auto-reconnect logic to work, 
            // but for initial startup we might want to know.
        });

        client.on('offline', () => {
            console.warn('MQTT Client is offline.');
        });

        client.on('reconnect', () => {
            console.log('MQTT Client reconnecting...');
        });
    });
}

/**
 * Publishes a message to a specific topic.
 * 
 * @param {string} topic The topic (e.g., 'company/acme/user/user123') - USE SLASHES!
 * @param {object} message The message payload to be sent.
 * @returns {Promise<boolean>} True if publish was successful/queued.
 */
async function publishMessage(topic, message) {
    if (!client || !client.connected) {
        console.error('Cannot publish message: MQTT client is not connected.');
        return false;
    }

    // Ensure we use the same format as the mobile app (Slashes)
    // If the topic comes in as dots, convert it to slashes to be safe.
    // The previous logic used dots because AMQP->MQTT mapping required it.
    // Now we are native MQTT, so we just use what the subscriber uses.
    const mqttTopic = topic.replace(/\./g, '/');

    const payload = JSON.stringify(message);

    return new Promise((resolve) => {
        client.publish(mqttTopic, payload, { qos: 1, retain: false }, (err) => {
            if (err) {
                console.error(`Failed to publish to ${mqttTopic}:`, err.message);
                resolve(false);
            } else {
                console.log(`[x] Sent to MQTT topic '${mqttTopic}': '${payload}'`);
                resolve(true);
            }
        });
    });
}

module.exports = {
    connectToRabbitMQ,
    publishMessage,
};
