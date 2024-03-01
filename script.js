const peerBranch = "JayKKumar01-";
const chunkSize = 1024 * 256;
const randomId = Math.floor(100000 + Math.random() * 900000);
const peerId = `${peerBranch}${randomId}`;
const peer = new Peer(peerId);

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

let conn;
const receivedFileData = new Map();
const sendFileData = new Map();
let isFileBeingTransfered = false;

document.addEventListener('DOMContentLoaded', () => {
    // Event listeners for file input and file list
    appendLog(`My ID is: ${randomId}`);
    fileInput.addEventListener('change', handleFileSelection);
    var ListContainer = document.getElementById('fileList');
    ListContainer.addEventListener('click', handleFileListClick);
});

peer.on('open', () => appendLog('Connected!'));

peer.on('connection', setupConnection);

function connect() {
    // Establish a connection with the target peer
    const targetPeerId = targetPeerIdInput.value.trim();
    if (targetPeerId !== '') {
        conn = peer.connect(peerBranch + targetPeerId, { reliable: true });
        conn.on('open', () => handleConnectionOpen(targetPeerId));
        conn.on('data', handleData);
    }
}

function appendLog(log) {
    // Log messages to the textarea
    logsTextarea.value += `${log}\n`;
    logsTextarea.scrollTop = logsTextarea.scrollHeight;
}

function showFileTransferWindow() {
    // Display the file transfer window
    transferContainer.style.display = 'block';
    roomContainer.classList.add('connected');
}

function setupConnection(connection) {
    // Setup connection when a peer connection is established
    conn = connection;
    const remoteId = conn.peer.replace(peerBranch, '');
    appendLog(`Connected to ${remoteId}`);
    showFileTransferWindow();
    conn.on('data', handleData);
    conn.on('error', (err) => appendLog(`Connection error: ${err}`));
}

function handleConnectionOpen(targetPeerId) {
    // Handle actions when the connection is open
    appendLog(`Connected to ${targetPeerId}`);
    targetPeerIdInput.value = '';
    showFileTransferWindow();
}

function handleFileSelection() {
    // Handle file selection changes
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

function handleFileListClick(event) {
    // Handle file list item click events
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

function handleData(data) {
    // Handle data received from the peer
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

function handleSignal(data) {
    // Handle signaling data
    const fileMap = receivedFileData.get(data.id);
    updateProgressBar("Upload", data.progress);

    if (fileMap.offset < fileMap.fileSize) {
        // Continue sending chunks if file transfer is incomplete
        setTimeout(() => sendChunk(fileMap), 0);
    } else {
        // File transfer completed
        isFileBeingTransfered = false;
        const index = fileMap.index;
        sendFileData.delete(data.id);

        appendLog(`Transfer completed!`);

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

function downloadFile(fileName, fileData) {
    // Trigger file download
    const blob = new Blob([fileData], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    link.remove();
}

function generateFileTransferId() {
    // Generate a random ID for file transfer
    return Math.floor(100000 + Math.random() * 900000);
}

function showProgressContainer(str, fileName, index) {
    // Display progress container for file transfer
    fileNameElement.textContent = `${index}: ${fileName}`;
    progressContainer.style.display = 'block';
    transferContainer.style.display = 'none';
    progressBar.style.width = '0%';
    progressText.textContent = `${str}: 0%`;
    appendLog(`${index}: File transfer started: ${fileName}`);
}

function updateProgressBar(str, progress) {
    // Update progress bar during file transfer
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${str}: ${progress}%`;
}

function hideProgressContainer() {
    // Hide progress container after file transfer completion
    progressContainer.style.display = 'none';
    transferContainer.style.display = 'block';
}

function sendChunk(fileMap) {
    // Send file chunk to the peer
    const offset = fileMap.offset;
    const chunk = fileMap.fileData.slice(offset, offset + chunkSize);
    conn.send({
        type: 'file',
        id: fileMap.fileTransferId,
        data: chunk,
        name: fileMap.fileName,
        offset: offset,
        totalSize: fileMap.fileSize,
    });
    fileMap.offset += chunk.byteLength;
}

function sendFile() {
    // Initiate file transfer
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

function sendFiles(index) {
    // Send multiple files to the peer
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
        };
        receivedFileData.set(fileTransferId, fileMap);
        setTimeout(() => sendChunk(fileMap), 0);
    };

    reader.readAsArrayBuffer(file);
}

function updateSender(id, progress) {
    // Send progress update to the peer
    conn.send({ type: 'signal', id: id, progress: progress });
}

function handleFileData(data) {
    // Handle incoming file data from the peer
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
    updateProgressBar("Download", progress);
    updateSender(fileTransferId, progress);

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
