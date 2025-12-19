// This daemon service is responsible for polling the external API to check for new tickets.
const fetch = require('node-fetch');
const { publishMessage } = require('./rabbitmq_service');

// --- CONFIGURATION ---
const API_BASE_URL = 'http://localhost:3000/api'; // The backend server exposing the mock API
const POLLING_INTERVAL_MS = 15000; // 15 seconds
const TENANT_ID = 'acme'; // The tenant (company) ID to check for. This should be dynamic in a real app.

let isPolling = false;

/**
 * Fetches data from the mock API.
 * @param {string} endpoint The API endpoint to call.
 * @returns {Promise<object>} The JSON response from the API.
 */
async function fetchFromApi(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) {
            throw new Error(`API call failed with status ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`[Daemon] Error fetching from ${endpoint}:`, error.message);
        throw error;
    }
}

/**
 * The main polling logic. Checks for new tickets and triggers notifications if any are found.
 */
async function pollForNewTickets() {
    if (isPolling) {
        // console.log('[Daemon] Skipping poll cycle, previous one still running.');
        return;
    }
    isPolling = true;
    // console.log(`[Daemon] Polling for new tickets for tenant: ${TENANT_ID}`);

    try {
        // Step 1: Check if the tenant has new tickets
        const checkResponse = await fetchFromApi(`check-tickets?tenant=${TENANT_ID}`);

        // Log heartbeat periodically or on activity
        // if (Math.random() < 0.1) console.log(`[Daemon] Heartbeat - Polling for ${TENANT_ID}...`);

        if (checkResponse && checkResponse.hasNewTickets) {
            console.log(`[Daemon] New tickets found for tenant '${TENANT_ID}'. Fetching recipients...`);

            // Step 2: Retrieve the associated recipients (phone numbers, emails, etc.)
            // In our case, we get user and group IDs for MQTT topics.
            const recipientsResponse = await fetchFromApi(`ticket-recipients?tenant=${TENANT_ID}`);

            if (recipientsResponse && recipientsResponse.recipients) {
                // Step 3: Use RabbitMQ to send notifications
                for (const recipient of recipientsResponse.recipients) {
                    // The topic format is adapted for the mobile client.
                    // Note: RabbitMQ topics use dots as separators, not slashes.
                    const topic = `company.${TENANT_ID}.${recipient.type}.${recipient.id}`;

                    const message = {
                        title: 'New Ticket Alert',
                        body: `A new ticket has been assigned to ${recipient.type} ${recipient.id}.`
                    };

                    await publishMessage(topic, message);
                    // console.log(`[Daemon] Notification dispatched for ${recipient.type}:${recipient.id}`);
                }
            }
        } else {
            // console.log(`[Daemon] No new tickets for tenant '${TENANT_ID}'.`);
        }
    } catch (error) {
        console.error('[Daemon] An error occurred during the polling cycle:', error.message);
    } finally {
        isPolling = false;
    }
}

/**
 * Starts the polling mechanism.
 */
function startPolling() {
    console.log(`[Daemon] Starting polling service. Interval: ${POLLING_INTERVAL_MS / 1000} seconds.`);
    // Delay start slightly to allow RabbitMQ connection to establish
    setTimeout(() => {
        // Initial call
        pollForNewTickets();

        // Set up recurring poll
        // Set up recurring poll
        setInterval(pollForNewTickets, POLLING_INTERVAL_MS);
        console.log(`[Daemon] Polling started.`);
    }, 5000);
}

module.exports = {
    startPolling
};
