// SECTION 1: Screen Wake Lock Functionality
async function keepScreenAwake() {
    try {
        if ('wakeLock' in navigator) {
            const wakeLock = await navigator.wakeLock.request('screen');
            console.log('Screen wake lock is active.');

            document.addEventListener('visibilitychange', async () => {
                if (document.visibilityState === 'visible') {
                    await navigator.wakeLock.request('screen');
                    console.log('Screen wake lock restored.');
                } else {
                    wakeLock.release();
                    console.log('Screen wake lock released.');
                }
            });
        } else {
            console.warn('Wake Lock API is not supported on this browser.');
        }
    } catch (err) {
        console.error('Failed to acquire wake lock:', err);
    }
}

keepScreenAwake();

// SECTION 2: Constants and Variables
const prefix = "JayKKumar01-File-Transfer-";
const initChunkSize = 1024 * 1024; // Initial chunk size for file transfer
let chunkSize = initChunkSize;
let shouldChangeChunkSize = false;
let UPS = 4;
let isZipSelected = true;
let isMultipleFiles = false;

const peerBranch = `${prefix}${getTodayDate()}-`;
const randomId = Math.floor(100000 + Math.random() * 900000);
const peerId = `${peerBranch}${randomId}`;

// // Add JSZip object for zipping
let jsZip = new JSZip();
let peer = new Peer(peerId);
let conn;
let isFileBeingTransfered = false;
let time, transferTime;

const receivedFileData = new Map();
const sendFileData = new Map();

// DOM elements
const logsTextarea = document.getElementById('logs');
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

// SECTION 3: Utility Functions

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
}

function appendLog(log) {
    logsTextarea.value += `${log}\n`;
    logsTextarea.scrollTop = logsTextarea.scrollHeight;
}

function calculateTransferRate(fileSize, timeDiff) {
    return ((fileSize / 1024) / (timeDiff / 1000)).toFixed(2);
}


function toggleContainers(visibleContainer, hiddenContainers) {
    visibleContainer.style.display = 'block';
    hiddenContainers.forEach(container => container.style.display = 'none');
}

function updateProgressBar(str, progress, transferRate) {
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${str}: ${progress}% (${transferRate} KB/s)`;
    if (shouldChangeChunkSize) {
        chunkSize = transferRate * Math.floor(1024 / UPS);
    }
}

function hideProgressContainer() {
    progressContainer.style.display = 'none';
    transferContainer.style.display = 'block';
}

function updateUPS() {
    const chunkSizeSelect = document.getElementById('chunkSizeSelect');
    UPS = parseInt(chunkSizeSelect.value);
    appendLog(`UPS updated to ${UPS}`);
}


// SECTION 4: Peer Connection Management
function handlePeer() {
    peer.on('open', () => appendLog(`My ID is: ${randomId}`));
    peer.on('connection', (incomingConn) => {
        appendLog(`Incoming connection from: ${incomingConn.peer.split('-').pop()}`);
        setupConnection(incomingConn);
    });
    peer.on('disconnected', () => appendLog('Disconnected from peer.'));
    peer.on('close', () => appendLog('Peer closed.'));
}

function setupConnection(connection) {
    conn = connection;
    conn.on('open', () => {
        const remoteId = conn.peer.replace(peerBranch, '');
        appendLog(`Connected to ${remoteId}`);
        toggleContainers(transferContainer, [roomContainer, controlContainer, waitContainer]);
    });

    conn.on('data', handleData);
    conn.on('close', () => appendLog("Data connection closed."));
    conn.on('error', (err) => appendLog("Data connection error: " + err));
}

function connect() {
    const targetPeerId = document.getElementById('targetPeerId').value.trim();
    if (targetPeerId !== '') {
        let connection = peer.connect(peerBranch + targetPeerId, { reliable: true });
        appendLog(`Trying to connect with ID: ${targetPeerId}`);
        setupConnection(connection);
    }
}

handlePeer();


// need to organize code after this line... pending



let setLocation = false;
let findPeer = false;

// Wait for the DOM content to be fully loaded before executing script
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners for file input and file list
    fileInput.addEventListener('change', handleFileSelection);
    var ListContainer = document.getElementById('fileList');
    ListContainer.addEventListener('click', handleFileListClick);

    document.getElementById('zipToggle').addEventListener('change', function () {
        isZipSelected = this.checked; // true if checked, false otherwise
        appendLog(`Zip download is ${isZipSelected ? 'enabled' : 'disabled'}`);
        // You can use this state when determining whether to zip files
    });
});

function showWaitingWindow() {
    toggleContainers(waitContainer, [controlContainer]);
}

function showControlContainer() {
    toggleContainers(controlContainer, [roomContainer]);
}
function showRoomContainer() {
    toggleContainers(roomContainer, [controlContainer]);
}

function handleDisconnect() {
    appendLog('Disconnected from peer.');
}
function handleClose() {
    appendLog('Peer closed.');
}



// Event handler for file selecthanges
async function handleFileSelection() {
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
        isMultipleFiles = data.fileCount > 1;
        
    } else if (data.type === 'signal') {
        // Handle signaling data
        setTimeout(() => handleSignal(data), 0);
    } else if (data.type === 'transfer_complete') {

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

async function addToZip(fileName, fileTransferId, fileTransferInfo, isLastFile) {
    try {
        jsZip.file(fileName, fileTransferInfo.blob);
        appendLog(`${fileName} successfully added to the zip.`);
        fileTransferInfo.blob = null;
        receivedFileData.delete(fileTransferId);
        if (isLastFile) {
            zipAndDownload();
        }
    } catch (error) {
        appendLog(`Error while zipping ${fileName}: ${error.message}`);
        console.error(`Error adding ${fileName} to zip:`, error);
    }
}


async function downloadBlob(fileName, fileTransferId,fileTransferInfo){
    const link = document.createElement('a');
    link.href = URL.createObjectURL(fileTransferInfo.blob);
    link.download = fileName;
    link.click();
    link.remove();
    fileTransferInfo.blob = null;
    receivedFileData.delete(fileTransferId);
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


// function updateProgressBar(str, progress) {
//     progressBar.style.width = `${progress}%`;
//     progressText.textContent = `${str}: ${progress}%`;
// }



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
            chunkSize = initChunkSize;

            conn.send({ type: 'transfer_complete', message: 'All files have been successfully transferred!' });

        }
    }
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
    const fileCount = fileInput.files.length;
    const isLastFile = index === fileCount - 1;

    conn.send({ type: 'ready', fileName: file.name, indexInfo: indexInfo, isLastFile: isLastFile, fileCount: fileCount });


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
            lastChunk: 0,
            isLastFile: isLastFile
        };
        receivedFileData.set(fileTransferId, fileMap);
        setTimeout(() => sendChunk(fileMap), 0);
    };

    reader.readAsArrayBuffer(file);
}

// Function to send file chunk to the peer
function sendChunk(fileMap) {
    // const t = new Date();
    const offset = fileMap.offset;
    const chunk = fileMap.fileData.slice(offset, offset + chunkSize);
    // appendLog(offset+": "+(new Date()-t)+" ms");
    conn.send({
        type: 'file',
        id: fileMap.fileTransferId,
        data: chunk,
        name: fileMap.fileName,
        offset: offset,
        totalSize: fileMap.fileSize,
        isLastFile: fileMap.isLastFile
    });
    fileMap.offset += chunk.byteLength;
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
// Add a map to store the blobs of completed files
// let completedFiles = new Map();



// Function to zip all files and trigger download
async function zipAndDownload() {
    try {
        // Generate zip file
        appendLog("Generating zip file to download...");
        const zipBlob = await jsZip.generateAsync({ type: 'blob' });
        appendLog("ZIP file generated successfully.");

        // Create a link to download the file
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = peerBranch+'.zip';
        link.click();

        // Clean up
        URL.revokeObjectURL(link.href);
        appendLog("Downloaded all files as ZIP!");
        jsZip = new JSZip();
    } catch (error) {
        appendLog(`Error during zip generation: ${error.message}`);
        console.error("Error generating zip:", error);
    }
}


// Function to handle incoming file data from the peer
function handleFileData(data) {
    const fileName = data.name;
    const fileData = data.data;
    const offset = data.offset;
    const fileTransferId = data.id;
    const isLastFile = data.isLastFile;


    if (!receivedFileData.has(fileTransferId)) {
        receivedFileData.set(fileTransferId, { blob: new Blob(), totalSize: 0 });
    }
    // if (!receivedFileData.has(fileTransferId)) {
    //     receivedFileData.set(fileTransferId, { chunks: [], totalSize: 0 });
    // }


    const fileTransferInfo = receivedFileData.get(fileTransferId);

    // fileTransferInfo.chunks.push(fileData); // Store chunks
    // fileTransferInfo.totalSize += fileData.byteLength;

    // fileTransferInfo.chunks[fileTransferInfo.chunks.length] = { chunk: fileData, offset: offset };
    fileTransferInfo.blob = new Blob([fileTransferInfo.blob, fileData]); // Append received data to the blob

    fileTransferInfo.totalSize += fileData.byteLength;

    const totalSize = data.totalSize;
    const receivedSize = fileTransferInfo.totalSize;
    // const receivedSize = fileTransferInfo.blob.size;

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

        setTimeout(() => {
            if(isZipSelected && isMultipleFiles){
                addToZip(fileName, fileTransferId, fileTransferInfo, isLastFile);
            }else{
                downloadBlob(fileName, fileTransferId,fileTransferInfo);
            }

            hideProgressContainer();
            isFileBeingTransfered = false;
            appendLog("Done!");
        }, 0);
    }
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
