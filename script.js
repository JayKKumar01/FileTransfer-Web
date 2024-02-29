const peerBranch = "JayKKumar01-";
const randomId = Math.floor(100000 + Math.random() * 900000);
const peerId = `${peerBranch}${randomId}`;
const peer = new Peer(peerId);

const logsTextarea = document.getElementById('logs');
const targetPeerIdInput = document.getElementById('targetPeerId');
const transferContainer = document.getElementById('transfer-container');
const roomContainer = document.getElementById('room-container');
const fileInput = document.getElementById('fileInput');

let conn;
const receivedFileData = new Map();

document.addEventListener('DOMContentLoaded', () => {
    appendLog(`My ID is: ${randomId}`);
});

peer.on('open', () => {
    appendLog(`Connected!`);
});

peer.on('connection', (connection) => {
    setupConnection(connection);
});

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

function appendLog(log) {
    logsTextarea.value += log + '\n';
    logsTextarea.scrollTop = logsTextarea.scrollHeight;
}

function showFileTransferWindow() {
    appendLog("Transfer Window Active");
    transferContainer.style.display = 'block';
    roomContainer.classList.add('connected');
}

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

function handleConnectionOpen(targetPeerId) {
    appendLog(`Connected to ${targetPeerId}`);
    targetPeerIdInput.value = '';
    showFileTransferWindow();
}

function handleData(data) {
    if (data.type === 'file') {
        setTimeout(() => {
            handleFileData(data);
        }, 0);
    } else if(data.type === 'signal'){
        //appendLog("4");
        // Handle other types of data
        // Add your logic here for handling different types of messages
    }
}

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

function sendFile() {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const chunkSize = 1024 * 1024; // 1 MB chunks (adjust as needed)
        const fileTransferId = generateFileTransferId();

        const reader = new FileReader();

        reader.onload = function (event) {
            const fileData = event.target.result;
            let offset = 0;

            function sendChunk() {
                const chunk = fileData.slice(offset, offset + chunkSize);
                conn.send({ type: 'file', id: fileTransferId, data: chunk, name: file.name, offset: offset, totalSize: file.size });

                offset += chunk.byteLength;
            }

            setTimeout(() => {
                sendChunk();
            }, 0);

            conn.on('data', function (data) {
                if (data.type === 'signal' && data.id === fileTransferId) {
                    appendLog(`Sent ${data.progress}% of ${file.name}`);
                }
                if (offset < file.size) {
                    setTimeout(() => {
                        sendChunk();
                    }, 0);
                } else {
                    appendLog(`File transfer completed: ${file.name}`);
                }
            });


        };

        reader.readAsArrayBuffer(file);
    } else {
        appendLog('Please select a file to send.');
    }
}

function updateSender(id,progress){
    conn.send({ type: 'signal', id: id, progress: progress });
}

function handleFileData(data) {
    const fileName = data.name;
    const fileData = data.data;
    const offset = data.offset;
    const fileTransferId = data.id;

    if (!receivedFileData.has(fileTransferId)) {
        receivedFileData.set(fileTransferId, { chunks: [], totalSize: 0 });
    }
    
    const fileTransferInfo = receivedFileData.get(fileTransferId);

    fileTransferInfo.chunks[offset] = fileData;
    fileTransferInfo.totalSize += fileData.byteLength;

    const totalSize = data.totalSize;
    const receivedSize = fileTransferInfo.totalSize;

    const progress = Math.floor((receivedSize / totalSize) * 100);
    updateSender(fileTransferId,progress);

    appendLog(`Received ${progress}% of ${fileName}`);

    if (receivedSize === totalSize) {
        setTimeout(() => {
            const completeFile = new Uint8Array(totalSize);
            const chunksArray = fileTransferInfo.chunks;

            chunksArray.forEach((chunk, offset) => {
                completeFile.set(new Uint8Array(chunk), offset);
            });

            downloadFile(fileName, completeFile);

            receivedFileData.delete(fileTransferId);

            appendLog(`Received file: ${fileName}`);
        }, 0);
    }
}
