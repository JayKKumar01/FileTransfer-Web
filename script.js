// Prefix for generating unique peer IDs
const peerBranch = "JayKKumar01-";

// Size of each file transfer chunk
let chunkSize = 1024 * 16;
let UPS = 4;

// function updateChunkSize() {
//     const chunkSizeSelect = document.getElementById('chunkSizeSelect');
//     chunkSize = parseInt(chunkSizeSelect.value);
//     appendLog(`Chunk size updated to ${chunkSize / 1024} KB.`);
// }
function updateUPS() {
    const chunkSizeSelect = document.getElementById('chunkSizeSelect');
    UPS = parseInt(chunkSizeSelect.value);
    appendLog(`UPS updated to ${UPS}`);
}

// Generate a random ID for the current peer
const randomId = Math.floor(100000 + Math.random() * 900000);
const peerId = `${peerBranch}${randomId}`;

// Create a Peer instance with the generated peer ID
let peer = new Peer(peerId);
handlePeer();

// DOM elements
const logsTextarea = document.getElementById('logs');
const targetPeerIdInput = document.getElementById('targetPeerId');
const transferContainer = document.getElementById('transfer-container');
const roomContainer = document.getElementById('room-container');
const controlContainer = document.getElementById('control-container');
const waitContainer = document.getElementById("wait-container");
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
var lastTransferTime;

let setLocation = false;
let findPeer = false;

// Wait for the DOM content to be fully loaded before executing script
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners for file input and file list
    appendLog(`My ID is: ${randomId}`);
    fileInput.addEventListener('change', handleFileSelection);
    var ListContainer = document.getElementById('fileList');
    ListContainer.addEventListener('click', handleFileListClick);
});


// Event handler when Peer instance is open (connection established)
function handlePeer() {
    peer.on('open', () => appendLog('Connected!'));

    // Event handler when a connection with a peer is established
    peer.on('connection', setupConnection);
    peer.on('disconnected', handleDisconnect);
    //peer.on('close',handleClose);
}


// Function to establish a connection with the target peer
function connect() {
    const targetPeerId = targetPeerIdInput.value.trim();
    if (targetPeerId !== '') {
        // Connect to the target peer using PeerJS
        let connection = peer.connect(peerBranch + targetPeerId, { reliable: true });
        connection.on('open', () => setupConnection(connection));
        connection.on('close', onDataConnectionClose);
        connection.on('error', onDataConnectionError);
    }
}

function onDataConnectionClose() {
    appendLog("Data connection closed");
}

// Custom function for 'error' event
function onDataConnectionError(err) {
    appendLog("Data connection error: " + err);
}

// Function to append log messages to the textarea
function appendLog(log) {
    logsTextarea.value += `${log}\n`;
    logsTextarea.scrollTop = logsTextarea.scrollHeight;
}

// Function to display the file transfer window
function showFileTransferWindow() {
    transferContainer.style.display = 'block';
    roomContainer.style.display = 'none';
    controlContainer.style.display = 'none';
    waitContainer.style.display = 'none';
}

function showWaitingWindow() {
    waitContainer.style.display = 'block';
    controlContainer.style.display = 'none';
}

function showControlContainer() {
    controlContainer.style.display = 'block';
    roomContainer.style.display = 'none';
}
function showRoomContainer() {
    controlContainer.style.display = 'none';
    roomContainer.style.display = 'block';
}

function handleDisconnect() {
    appendLog('Disconnected from peer.');
    // Add any additional actions you want to perform upon disconnection
    // For example, you might want to reset the UI or display a message to the user.
}
function handleClose() {
    appendLog('Peer closed.');
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

// Event handler for file selecthanges
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
        setTimeout(() => handleSignal(data), 0);
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

    chunkSize = transferRate * Math.floor(1024 / UPS);

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

function changeChunkSize(sendTime) {
    const diff = new Date() - sendTime;
}

// Function to handle signaling data
function handleSignal(data) {
    // changeChunkSize(data.sendTime);
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
            chunkSize = 1024 * 16;
        }
    }
}
// Function to send file chunk to the peer
function sendChunk(fileMap) {
    const t = new Date();
    const offset = fileMap.offset;
    const chunk = fileMap.fileData.slice(offset, offset + chunkSize);
    appendLog(offset+": "+(new Date()-t)+" ms");
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
function updateSender(id, progress, transferRate) {
    conn.send({
        type: 'signal',
        id: id,
        progress: progress,
        transferRate: transferRate
    });
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

    const transferRate = Math.floor((fileData.byteLength / 1024) / ((new Date() - transferTime) / 1000));
    transferTime = new Date();
    updateProgressBar("Download", progress, transferRate);
    updateSender(fileTransferId, progress, transferRate);

    if (receivedSize === totalSize) {
        // File received completely, initiate download
        const timeDiff = new Date() - time;
        const transferRate = calculateTransferRate(totalSize, timeDiff);
        appendLog(`File transfer completed in ${timeDiff / 1000} seconds. Transfer rate: ${transferRate} KB/s`);
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

function getLocation(findPeerVal) {
    findPeer = findPeerVal;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError, {
            timeout: 60000,
            enableHighAccuracy: true,
            maximumAge: 0
        });
    } else {
        appendLog("Geolocation is not supported by this browser.");
    }
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            appendLog("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            appendLog("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            appendLog("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            appendLog("An unknown error occurred.");
            break;
    }
}

function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    const time = getUnixTimeSync();
    // const time = 1000000;
    const location = generateLocationNumber(latitude, longitude);

    const id = timestampToDateString(time) + "_" + location;
    // const id = location;
    if (!findPeer) {
        host(id);
        showWaitingWindow();
        appendLog(`Host ID: ${id}`);
    } else {
        find(id, time, location);
        showWaitingWindow();
    }

}


function generateLocationNumber(latitude, longitude) {
    const decimalPlaces = 4;

    let a = latitude.toFixed(decimalPlaces).split('.');
    let b = longitude.toFixed(decimalPlaces).split('.');

    return `${a[0]}_${b[0]}_${b[1]}_${a[1]}`;
}

function host(peerId) {
    peer.destroy();
    peer = new Peer(`${peerBranch}${peerId}`);
    handlePeer();
}

function find(id, time, location) {
    targetPeerIdInput.value = id;
    appendLog("Connecting to " + targetPeerIdInput.value);
    connect();
    targetPeerIdInput.value = timestampToDateString(time - 60) + "_" + location;
    connect();
    appendLog("Connecting to " + targetPeerIdInput.value);
}




function getUnixTimeSync() {
    const apiUrl = "https://worldtimeapi.org/api/timezone/Asia/Kolkata";



    // Create a synchronous XMLHttpRequest
    const request = new XMLHttpRequest();
    request.open("GET", apiUrl, false); // Make the request synchronous
    request.send();



    if (request.status === 200) {
        const data = JSON.parse(request.responseText);
        const unixTime = data.unixtime;
        return unixTime;
    } else {
        const errorMessage = `HTTP error! Status: ${request.status}`;
        appendLog(errorMessage);
        return 1000000;
    }
}

function timestampToDateString(timestamp) {

    const date = new Date(timestamp * 1000);

    const seconds = date.getSeconds();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const dateString = `${year}-${month}-${day}_${hours}_${minutes}`;
    return dateString;
}


function logTime() {
    const unixTime = getUnixTimeSync();
    appendLog("Date: " + timestampToDateString(unixTime));
    appendLog("Date: " + timestampToDateString(unixTime - 60));
}