# Aeriez Alart Backend

A Node.js backend server that provides a web interface for sending MQTT notifications. This backend allows users to publish messages to MQTT topics through a simple web form, making it easy to send alerts or notifications to connected MQTT clients.

## Features

- **Web Interface**: Clean, responsive web page for sending notifications
- **MQTT Integration**: Publishes messages to a public MQTT broker (test.mosquitto.org)
- **REST API**: POST endpoint `/notify` for programmatic message sending
- **Static File Serving**: Serves static assets from the `public/` directory

## Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Server

Start the server with:
```bash
npm start
```

The server will start on `http://localhost:3000`. Open this URL in your browser to access the notification sender interface.

## Usage

### Web Interface

1. Open `http://localhost:3000` in your browser
2. Select a company/topic from the dropdown (Acme, Stark, Wayne, or Cyberdyne)
3. Enter your notification message in the text area
4. Click "Send Notification" to publish the message to the MQTT broker

### API Usage

You can also send notifications programmatically by making a POST request to `/notify`:

```bash
curl -X POST http://localhost:3000/notify \
  -H "Content-Type: application/json" \
  -d '{"topic": "acme", "message": "Your notification message here"}'
```

**Request Body:**
- `topic` (required): The MQTT topic to publish to
- `message` (required): The notification message content

**Response:**
- Success: `{"success": true, "message": "Notification sent successfully!"}`
- Error: `{"success": false, "message": "Error description"}`

## Project Structure

```
backend/
├── server.js          # Main Express server file
├── index.html         # Web interface for sending notifications
├── package.json       # Project dependencies and scripts
├── package-lock.json  # Lockfile for exact dependency versions
├── public/            # Static assets directory
│   └── logo.png       # Logo image for the web interface
└── README.md          # This file
```

## Dependencies

- **express**: Web framework for Node.js
- **mqtt**: MQTT client library for publishing messages

## MQTT Broker

The server connects to the public MQTT broker at `mqtt://test.mosquitto.org`. Messages are published with QoS level 1 for reliable delivery.

## Development

To modify the server or web interface:

1. Edit `server.js` for backend changes
2. Edit `index.html` for frontend changes
3. Restart the server after backend changes: `npm start`

## License

ISC