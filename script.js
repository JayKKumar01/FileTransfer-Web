const peerBranch = "JayKKumar01-";
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
let isFileBeingTransfered = false;

document.addEventListener('DOMContentLoaded', () => {
    appendLog(`My ID is: ${randomId}`);
    fileInput.addEventListener('change', handleFileSelection);
    showFileTransferWindow();

    var ListContainer = document.getElementById('fileList');

    // Attach a click event listener to the file list container
    ListContainer.addEventListener('click', function (event) {

        const item = event.target;


        var fileListItems = document.querySelectorAll('#fileList li');

        // // Attach a click event listener to each file list item
        fileListItems.forEach(function (listItem) {
            if (item == listItem) {
                item.remove();
                const fileName = item.textContent.trim();

                // Remove the file from fileInput.files
                var dataTransfer = new DataTransfer();

                // Filter and add files to the DataTransfer object
                Array.from(fileInput.files).forEach(file => {
                    if (file.name !== fileName) {
                        dataTransfer.items.add(file);
                    }
                });

                // Update the fileInput.files
                fileInput.files = dataTransfer.files;
            }
        });

        if (fileListItems.length < 2) {
            fileListContainer.style.display = 'none';
        }


    });
});

// Add this function to handle file selection changes
function handleFileSelection() {
    const selectedFiles = fileInput.files;
    const fileList = document.getElementById('fileList');

    fileList.innerHTML = ''; // Clear previous file list

    if (selectedFiles.length > 1) {
        fileListContainer.style.display = 'block';
        for (let i = 0; i < selectedFiles.length; i++) {
            const fileName = selectedFiles[i].name;
            const listItem = document.createElement('li');
            listItem.textContent = fileName;
            fileList.appendChild(listItem);
        }
    } else {
        fileListContainer.style.display = 'none';
        fileList.innerHTML = '<li>No files selected</li>';
    }
}


peer.on('open', () => {
    appendLog(`Connected!`);
});

peer.on('connection', (connection) => {
    setupConnection(connection);
});

function connect() {
    const targetPeerId = targetPeerIdInput.value.trim();

    if (targetPeerId !== '') {
        conn = peer.connect(peerBranch + targetPeerId, { reliable: true });
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
    } else if (data.type === 'ready') {
        showProgressContainer("Download", data.fileName);
        isFileBeingTransfered = true;
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

function showProgressContainer(str, fileName) {

    fileNameElement.textContent = fileName;
    progressContainer.style.display = 'block'; // Show progress container
    transferContainer.style.display = 'none';

    // Reset progress bar
    progressBar.style.width = '0%';
    progressText.textContent = `${str}: 0%`;

    appendLog(`File transfer started: ${fileName}`);
}

function updateProgressBar(str, progress) {
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${str}: ${progress}%`;
}

function hideProgressContainer() {
    const progressContainer = document.getElementById('progress-container');
    progressContainer.style.display = 'none'; // Hide progress container
    transferContainer.style.display = 'block';
}

function sendFile() {
    if (isFileBeingTransfered) {
        appendLog('File transfer is already in progress.');
        return;
    }

    isFileBeingTransfered = true;

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const chunkSize = 1024 * 256; // 1 MB chunks (adjust as needed)
        const fileTransferId = generateFileTransferId();

        showProgressContainer("Upload", file.name);

        conn.send({ type: 'ready', fileName: file.name });

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
                    updateProgressBar("Upload", data.progress);
                    if (offset < file.size) {
                        setTimeout(() => {
                            sendChunk();
                        }, 0);
                    } else {
                        isFileBeingTransfered = false;
                        appendLog(`File transfer completed: ${file.name}`);
                        hideProgressContainer();
                    }
                }

            });


        };

        reader.readAsArrayBuffer(file);
    } else {
        appendLog('Please select a file to send.');
    }
}

function updateSender(id, progress) {
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

    fileTransferInfo.chunks[fileTransferInfo.chunks.length] = { chunk: fileData, offset: offset };

    fileTransferInfo.totalSize += fileData.byteLength;

    const totalSize = data.totalSize;
    const receivedSize = fileTransferInfo.totalSize;

    const progress = Math.floor((receivedSize / totalSize) * 100);
    updateProgressBar("Download", progress);
    updateSender(fileTransferId, progress);




    if (receivedSize === totalSize) {
        appendLog(`Received file: ${fileName}`);

        appendLog("Joining...");

        setTimeout(() => {
            const completeFile = new Uint8Array(totalSize);
            const chunksArray = fileTransferInfo.chunks;

            chunksArray.forEach(data => {
                completeFile.set(new Uint8Array(data.chunk), data.offset);
            });

            downloadFile(fileName, completeFile);

            receivedFileData.delete(fileTransferId);


            hideProgressContainer();
            isFileBeingTransfered = false;

        }, 0);
    }
}
