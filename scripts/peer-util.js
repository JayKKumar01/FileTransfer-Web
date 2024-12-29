//peer-util.js
// SECTION 4: Peer Connection Management
import {
    PREFIX,
    RANDOM_ID,
    ROOM_CONTAINER,
    TRANSFER_CONTAINER,
    TARGET_PEER_ID_INPUT,
    CONNECT_BUTTON
} from './constants.js';
import {
    getTodayDate,
    appendLog,
    toggleContainers
} from './utils.js';
import { handleSignal} from './sender-util.js';
import { ready, handleFileData } from './receiver-util.js'

// Generate peer connection ID using prefix and random ID
const peerBranch = `${PREFIX}${getTodayDate()}-`;
const peerId = `${peerBranch}${RANDOM_ID}`;
const peer = new Peer(peerId);
let conn;

// Handle peer-related events like connection and disconnection
function handlePeer() {
    peer.on('open', () => appendLog(`My ID is: ${RANDOM_ID}`));
    peer.on('connection', (incomingConn) => {
        appendLog(`Incoming connection from: ${incomingConn.peer.split('-').pop()}`);
        setupConnection(incomingConn);
    });
    peer.on('disconnected', () => appendLog('Disconnected from peer.'));
    peer.on('close', () => appendLog('Peer closed.'));
}

// Setup the connection to the other peer
function setupConnection(connection) {
    conn = connection;
    conn.on('open', () => {
        const remoteId = conn.peer.replace(peerBranch, '');
        appendLog(`Connected to ${remoteId}`);
        toggleContainers(TRANSFER_CONTAINER, [ROOM_CONTAINER]);
    });

    // Handle data transfer
    conn.on('data', handleData);
    conn.on('close', () => appendLog("Data connection closed."));
    conn.on('error', (err) => appendLog("Data connection error: " + err));
}

// Connect to another peer using their ID
function connect() {
    const targetPeerId = TARGET_PEER_ID_INPUT.value.trim();
    if (targetPeerId !== '') {
        let connection = peer.connect(peerBranch + targetPeerId, { reliable: true });
        appendLog(`Trying to connect with ID: ${targetPeerId}`);
        setupConnection(connection);
    }
}

// Event handler for data received from the peer
function handleData(data) {
    if (data.type === 'file') {
        // Handle file data
        setTimeout(() => handleFileData(data), 0);
    } else if (data.type === 'ready') {
        setTimeout(() => ready(data),0);
    } else if (data.type === 'signal') {
        // Handle signaling data
        setTimeout(() => handleSignal(data), 0);
    } else if (data.type === 'transfer_complete') {

    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize peer handling
    handlePeer();
    // Set up the click event to trigger the connection process
    CONNECT_BUTTON.addEventListener('click',connect);
});

// Getter for `conn`
export function getConnection() {
    return conn;
}


