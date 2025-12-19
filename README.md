# Aeriez Alart Backend (Daemon)

This is the backend service for the Aeriez Alart notification system. It acts as a **Polling Daemon** that checks for new tickets from an external source (mocked internally) and pushes notifications to the mobile app via **RabbitMQ**.

## Features

- **Daemon Service**: Polls for new tickets every 15 seconds.
- **RabbitMQ Integration**: Connects using native MQTT protocol (just like the mobile app).
- **Web Interface**: Simple dashboard to trigger ticket status toggles manually.
- **REST API**: `/api/toggle-tickets` and `/api/trigger-tickets`.

## Prerequisites

1.  **Node.js** (v14+)
2.  **RabbitMQ Server**
    -   **Local**: Install RabbitMQ locally and enable the MQTT plugin: `rabbitmq-plugins enable rabbitmq_mqtt`.
    -   **Cloud**: Use [CloudAMQP](https://www.cloudamqp.com/) (Free Tier).

## Installation

1.  Navigate to the directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
    *(Ensure `mqtt` package is installed)*

## Configuration

The backend connects to RabbitMQ via the `MQTT_BROKER_URL` environment variable.

-   **Default (Local)**: `mqtt://guest:guest@localhost:1883`
-   **Cloud Example**: `mqtt://user:pass@instance.rmq.cloudamqp.com:1883`

To change the broker URL, set the environment variable before running, or edit `rabbitmq_service.js` directly.

## Running the Server

Start the server:
```bash
node server.js
```

You should see:
```
Server running at http://localhost:3000
Connecting to MQTT Broker...
Successfully connected to RabbitMQ (MQTT).
[Daemon] Polling started.
```

## How it Works

1.  **Polling**: The daemon (`daemon.js`) runs every 15 seconds.
2.  **Check**: It calls the `MockTicketAPI` to check for `hasNewTickets`.
3.  **Publish**: If tickets are found, it publishes a JSON message to RabbitMQ on topic `company/acme/user/user123`.
4.  **Delivery**: RabbitMQ pushes this message to the Android app instantly.

## Verification

To verify the system is working:
1.  Run the backend.
2.  Run the Flutter app and connect.
3.  Wait 15 seconds for the next poll cycle.
4.  OR: Toggle tickets manually via `http://localhost:3000`.

## Cloud Deployment (e.g., Render + CloudAMQP)

If deploying to a cloud provider like Render.com:
1.  Set the `MQTT_BROKER_URL` environment variable to your CloudAMQP URL.
2.  Ensure the provider supports long-running processes (Node.js web service).