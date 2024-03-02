// Prefix for generating unique peer IDs
const peerBranch = "JayKKumar01-";

// Size of each file transfer chunk
let chunkSize = 1024 * 256;

function updateChunkSize() {
    const chunkSizeSelect = document.getElementById('chunkSizeSelect');
    chunkSize = parseInt(chunkSizeSelect.value);
    appendLog(`Chunk size updated to ${chunkSize / 1024} KB.`);
}

// Generate a random ID for the current peer
const randomId = Math.floor(100000 + Math.random() * 900000);
const peerId = `${peerBranch}${randomId}`;

// Create a Peer instance with the generated peer ID
const peer = new Peer(peerId);

// DOM elements
const logsTextarea = document.getElementById('logs');
const targetPeerIdInput = document.getElementById('targetPeerId');
const transferContainer = document.getElementById('transfer-container');
const roomContainer = document.getElementById('room-container');
const fileInput = document.getElementById('fileInput');
const fileListContainer = document.getElementById('fileListContainer');
const progressContainer = document.getElementById('progress-container');
const fileNameElement = document.getElementById('fileName');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// Connection and file transfer state variables
let conn;
const receivedFileData = new Map();
const sendFileData = new Map();
let isFileBeingTransfered = false;
var time;
var transferTime;

// Wait for the DOM content to be fully loaded before executing script
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners for file input and file list
    appendLog(`My ID is: ${randomId}`);
    fileInput.addEventListener('change', handleFileSelection);
    var ListContainer = document.getElementById('fileList');
    ListContainer.addEventListener('click', handleFileListClick);
});

// Event handler when Peer instance is open (connection established)
peer.on('open', () => appendLog('Connected!'));

// Event handler when a connection with a peer is established
peer.on('connection', setupConnection);
peer.on('disconnected', handleDisconnect);

// Function to establish a connection with the target peer
function connect() {
    const targetPeerId = targetPeerIdInput.value.trim();
    if (targetPeerId !== '') {
        // Connect to the target peer using PeerJS
        let connection = peer.connect(peerBranch + targetPeerId, { reliable: true });
        connection.on('open', () => setupConnection(connection));
    }
}

// Function to append log messages to the textarea
function appendLog(log) {
    logsTextarea.value += `${log}\n`;
    logsTextarea.scrollTop = logsTextarea.scrollHeight;
}

// Function to display the file transfer window
function showFileTransferWindow() {
    transferContainer.style.display = 'block';
    roomContainer.classList.add('connected');
}

function handleDisconnect() {
    appendLog('Disconnected from peer.');
    // Add any additional actions you want to perform upon disconnection
    // For example, you might want to reset the UI or display a message to the user.
}

// Event handler when a peer connection is established
function setupConnection(connection) {
    conn = connection;
    const remoteId = conn.peer.replace(peerBranch, '');
    appendLog(`Connected to ${remoteId}`);
    targetPeerIdInput.value = '';
    showFileTransferWindow();
    conn.on('data', handleData);
    conn.on('error', (err) => appendLog(`Connection error: ${err}`));
}

// Event handler for file selection changes
function handleFileSelection() {
    const selectedFiles = fileInput.files;
    const fileList = document.getElementById('fileList');

    fileList.innerHTML = '';

    if (selectedFiles.length > 1) {
        // Display selected files in the file list container
        fileListContainer.style.display = 'block';
        for (let i = 0; i < selectedFiles.length; i++) {
            const fileName = selectedFiles[i].name;
            const listItem = document.createElement('li');
            listItem.textContent = fileName;
            fileList.appendChild(listItem);
        }
    } else {
        // Hide file list container if no or single file is selected
        fileListContainer.style.display = 'none';
        fileList.innerHTML = '<li>No files selected</li>';
    }
}

// Event handler for file list item click events
function handleFileListClick(event) {
    const item = event.target;
    const fileListItems = document.querySelectorAll('#fileList li');

    fileListItems.forEach((listItem) => {
        if (item == listItem) {
            // Remove the clicked file from the list and update file input
            item.remove();
            const fileName = item.textContent.trim();
            const dataTransfer = new DataTransfer();

            Array.from(fileInput.files).forEach((file) => {
                if (file.name !== fileName) {
                    dataTransfer.items.add(file);
                }
            });

            fileInput.files = dataTransfer.files;
        }
    });

    if (fileListItems.length < 2) {
        // Hide file list container if less than 2 files are present
        fileListContainer.style.display = 'none';
    }
}

// Event handler for data received from the peer
function handleData(data) {
    if (data.type === 'file') {
        // Handle file data
        setTimeout(() => handleFileData(data), 0);
    } else if (data.type === 'ready') {
        // Handle signal indicating readiness for file transfer
        showProgressContainer("Download", data.fileName, data.indexInfo);
        isFileBeingTransfered = true;
    } else if (data.type === 'signal') {
        // Handle signaling data
        handleSignal(data);
    }
}



// Function to trigger file download
function downloadFile(fileName, fileData) {
    const blob = new Blob([fileData], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    link.remove();
}

// Function to generate a random ID for file transfer
function generateFileTransferId() {
    return Math.floor(100000 + Math.random() * 900000);
}

// Function to display progress container for file transfer
function showProgressContainer(str, fileName, index) {
    fileNameElement.textContent = `${index}: ${fileName}`;
    progressContainer.style.display = 'block';
    transferContainer.style.display = 'none';
    progressBar.style.width = '0%';
    progressText.textContent = `${str}: 0%`;
    appendLog(`${index}: File transfer started: ${fileName}`);
    time = new Date();
    transferTime = time;
}

// Function to update progress bar during file transfer
function updateProgressBar(str, progress, transferRate) {
    progressBar.style.width = `${progress}%`;

    progressText.textContent = `${str}: ${progress}% (${transferRate} KB/s)`;

}
// function updateProgressBar(str, progress) {
//     progressBar.style.width = `${progress}%`;
//     progressText.textContent = `${str}: ${progress}%`;
// }

// Function to hide progress container after file transfer completion
function hideProgressContainer() {
    progressContainer.style.display = 'none';
    transferContainer.style.display = 'block';
}

// Function to handle signaling data
function handleSignal(data) {
    const fileMap = receivedFileData.get(data.id);

    updateProgressBar("Upload", data.progress, data.transferRate);
    // updateProgressBar("Upload", data.progress);

    if (fileMap.offset < fileMap.fileSize) {
        // Continue sending chunks if file transfer is incomplete
        setTimeout(() => sendChunk(fileMap), 0);
    } else {
        // File transfer completed
        isFileBeingTransfered = false;
        const index = fileMap.index;
        sendFileData.delete(data.id);

        const timeDiff = new Date() - time;
        const transferRate = calculateTransferRate(fileMap.fileSize, timeDiff);
        appendLog(`File transfer completed in ${timeDiff / 1000} seconds. Transfer rate: ${transferRate} KB/s`);


        // appendLog(`Transfer completed!`);

        if (index + 1 < fileInput.files.length) {
            // Send the next file if available
            setTimeout(() => sendFiles(index + 1), 1000);
        } else {
            // Hide progress container and reset file input
            hideProgressContainer();
            const dataTransfer = new DataTransfer();
            fileInput.files = dataTransfer.files;
            fileListContainer.style.display = 'none';
        }
    }
}
// Function to send file chunk to the peer
function sendChunk(fileMap) {
    const offset = fileMap.offset;
    const chunk = fileMap.fileData.slice(offset, offset + chunkSize);
    conn.send({
        type: 'file',
        id: fileMap.fileTransferId,
        data: chunk,
        name: fileMap.fileName,
        offset: offset,
        totalSize: fileMap.fileSize
    });
    fileMap.offset += chunk.byteLength;
}

// Function to initiate file transfer
function sendFile() {
    if (isFileBeingTransfered) {
        appendLog('File transfer is already in progress.');
        return;
    }

    if (fileInput.files.length > 0) {
        // Start sending files if files are selected
        isFileBeingTransfered = true;
        sendFiles(0);
    } else {
        appendLog('Please select a file to send.');
    }
}

// Function to send multiple files to the peer
function sendFiles(index) {
    const file = fileInput.files[index];
    const fileTransferId = generateFileTransferId();
    const indexInfo = `(${index + 1}/${fileInput.files.length})`;

    showProgressContainer("Upload", file.name, indexInfo);

    conn.send({ type: 'ready', fileName: file.name, indexInfo: indexInfo });

    const reader = new FileReader();

    reader.onload = function (event) {
        const fileData = event.target.result;
        const fileMap = {
            index: index,
            fileTransferId: fileTransferId,
            fileData: fileData,
            offset: 0,
            fileName: file.name,
            fileSize: file.size,
            lastChunk: 0
        };
        receivedFileData.set(fileTransferId, fileMap);
        setTimeout(() => sendChunk(fileMap), 0);
    };

    reader.readAsArrayBuffer(file);
}

// Function to send progress update to the peer
function updateSender(id, progress,transferRate) {
    conn.send({ type: 'signal', id: id, progress: progress, transferRate: transferRate });
}

// Function to handle incoming file data from the peer
function handleFileData(data) {
    const fileName = data.name;
    const fileData = data.data;
    const offset = data.offset;
    const fileTransferId = data.id;

    if (!receivedFileData.has(fileTransferId)) {
        receivedFileData.set(fileTransferId, { chunks: [], totalSize: 0 });
    }

    const fileTransferInfo = receivedFileData.get(fileTransferId);
    fileTransferInfo.chunks[fileTransferInfo.chunks.length] = { chunk: fileData, offset: offset };
    fileTransferInfo.totalSize += fileData.byteLength;

    const totalSize = data.totalSize;
    const receivedSize = fileTransferInfo.totalSize;

    const progress = Math.floor((receivedSize / totalSize) * 100);
    
    const transferRate = Math.floor((fileData.byteLength / 1024)/((new Date() - transferTime) / 1000));
    transferTime = new Date();
    updateProgressBar("Download", progress,transferRate);
    updateSender(fileTransferId, progress,transferRate);

    if (receivedSize === totalSize) {
        // File received completely, initiate download
        appendLog(`Received file: ${fileName}`);
        appendLog("Joining...");
        setTimeout(() => {
            const completeFile = new Uint8Array(totalSize);
            const chunksArray = fileTransferInfo.chunks;

            chunksArray.forEach((data) => {
                completeFile.set(new Uint8Array(data.chunk), data.offset);
            });

            downloadFile(fileName, completeFile);

            receivedFileData.delete(fileTransferId);

            hideProgressContainer();
            isFileBeingTransfered = false;
            appendLog("Done!");
        }, 0);
    }
}

function calculateTransferRate(fileSize, timeDiff) {
    // Calculate transfer rate in KB/s
    const transferRate = (fileSize / 1024) / (timeDiff / 1000);
    return transferRate.toFixed(2);
}

function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition);
    } else { 
      appendLog("Geolocation is not supported by this browser.");
    }
  }
  
  function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const str = "Latitude: " + latitude +                                                                                                                                                       
    "\nLongitude: " + longitude;
    appendLog(str);
    appendLog(generateLocationNumber(latitude,longitude));
  }

  function generateLocationNumber(latitude, longitude) {
    const decimalPlaces = 6;

    let a = latitude.toFixed(decimalPlaces).split('.');
    let b = longitude.toFixed(decimalPlaces).split('.');

    return `${a[0]} ${b[0]} ${a[1].replace(/^0+/, '')} ${b[1].replace(/^0+/, '')}`;
}