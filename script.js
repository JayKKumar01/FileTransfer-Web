// Peer setup
const peerBranch = "JayKKumar01-";
const randomId = Math.floor(100000 + Math.random() * 900000);
const peerId = `${peerBranch}${randomId}`;
const peer = new Peer(peerId);

// DOM elements
const logsTextarea = document.getElementById('logs');
const targetPeerIdInput = document.getElementById('targetPeerId');
const transferContainer = document.getElementById('transfer-container');
const roomContainer = document.getElementById('room-container');

// File input (global)
const fileInput = document.getElementById('fileInput');

// Connection variable
let conn;

const receivedFileData = new Map();

// Event listener when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    appendLog(`My ID is: ${randomId}`);
});

// Peer event handlers
peer.on('open', () => {
    appendLog(`Connected!`);
});

peer.on('connection', (connection) => {
    setupConnection(connection);
});

// Connect function
function connect() {
    const targetPeerId = targetPeerIdInput.value.trim();

    if (targetPeerId !== '') {
        conn = peer.connect(peerBranch + targetPeerId);
        conn.on('open', () => {
            handleConnectionOpen(targetPeerId);
        });

        conn.on('data', handleData);
    }
}

// Log function
function appendLog(log) {
    logsTextarea.value += log + '\n';
    logsTextarea.scrollTop = logsTextarea.scrollHeight;
}

// Display file transfer window
function showFileTransferWindow() {
    appendLog("Transfer Window Active");
    transferContainer.style.display = 'block';
    roomContainer.classList.add('connected');
}

// Setup event handlers for a new connection
function setupConnection(connection) {
    conn = connection;
    const remoteId = conn.peer.replace(peerBranch, '');
    appendLog(`Connected to ${remoteId}`);

    conn.on('data', handleData);

    showFileTransferWindow();

    conn.on('error', (err) => {
        appendLog('Connection error:', err);
    });
}

// Handle the opening of a connection
function handleConnectionOpen(targetPeerId) {
    appendLog(`Connected to ${targetPeerId}`);
    targetPeerIdInput.value = '';
    showFileTransferWindow();
}

// Handle incoming or outgoing data
function handleData(data) {
    if (data.type === 'file') {
        setTimeout(() => {
            handleFileData(data);
        }, 0);
    } else {
        // Handle other types of data
        // Add your logic here for handling different types of messages
    }
}


// Function to download a file
function downloadFile(fileName, fileData) {
    const blob = new Blob([fileData], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

function generateFileTransferId() {
    return Math.floor(100000 + Math.random() * 900000);
}

// Function to send a file
function sendFile() {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const chunkSize = 1024 * 1024; // 100 KB chunks (adjust as needed)
        const fileTransferId = generateFileTransferId();

        // Use a FileReader to read the file content
        const reader = new FileReader();

        reader.onload = function (event) {
            const fileData = event.target.result;
            let offset = 0;

            // Function to send a chunk of the file
            function sendChunk() {
                const chunk = fileData.slice(offset, offset + chunkSize);
                conn.send({ type: 'file', id: fileTransferId, data: chunk, name: file.name, offset: offset, totalSize: file.size });

                offset += chunk.byteLength;

                // Log each sent chunk
                const progress = Math.floor((offset / file.size) * 100);

                // Log the progress as a percentage
                appendLog(`Sent ${progress}% of ${file.name}`);

                if (offset < file.size) {
                    // If there are more chunks to send, recursively call sendChunk
                    sendChunk();
                } else {
                    // Notify that the file transfer is complete
                    appendLog(`File transfer completed: ${file.name}`);
                }
            }

            // Start sending chunks
            setTimeout(() => {
                sendChunk();
            }, 0);
        };

        // Read the file as an ArrayBuffer
        reader.readAsArrayBuffer(file);
    } else {
        appendLog('Please select a file to send.');
    }
}
// Handle file data
function handleFileData(data) {
    const fileName = data.name;
    const fileData = data.data;
    const offset = data.offset;
    const fileTransferId = data.id;

    // Store received file data in a Map, using offset as the key
    if (!receivedFileData.has(fileTransferId)) {
        // receivedFileData.set(fileTransferId, []);
        receivedFileData.set(fileTransferId, { chunks: [], totalSize: 0 });
    }
    const fileTransferInfo = receivedFileData.get(fileTransferId);

    fileTransferInfo.chunks[offset] = fileData;
    fileTransferInfo.totalSize += fileData.byteLength;

    // Check if all chunks are received
    const totalSize = data.totalSize;
    const receivedSize = fileTransferInfo.totalSize;

    // Log each received chunk
    const progress = Math.floor((receivedSize / totalSize) * 100);

    // Log the progress as a percentage
    appendLog(`Received ${progress}% of ${offset}`);

    if (receivedSize === totalSize) {
        setTimeout(() => {
            const completeFile = new Uint8Array(totalSize);
            const chunksArray = receivedFileData.get(fileTransferId).chunks;

            // Iterate over each chunk in the array
            chunksArray.forEach((chunk, offset) => {
                completeFile.set(new Uint8Array(chunk), offset);
            });



            // Download the complete file
            downloadFile(fileName, completeFile);

            // Clean up received file data
            receivedFileData.delete(fileTransferId);

            appendLog(`Received file: ${fileName}`);
        }, 0);
    }
}
