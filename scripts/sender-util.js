//sender-util.js
import {
    FILE_INPUT,
    FILE_LIST_CONTAINER,
    SEND_BUTTON
} from './constants.js';
import { getConnection } from './peer-util.js';
import {
    appendLog,
    calculateTransferRate,
    hideProgressContainer,
    updateProgressBar,
    generateFileTransferId,
    showProgressContainer
} from './utils.js';

let isFileBeingTransferred = false;
const sentFileData = new Map(); // Use Map for better structure
const INIT_CHUNK_SIZE = 1024 * 1024; // Initial chunk size for file transfer
let chunkSize = INIT_CHUNK_SIZE; // Dynamic chunk size
let conn;
let time, transferTime;

function setTransferStatus(status){
    isFileBeingTransferred = status;
}


function sendFile() {
    if (isFileBeingTransferred) {
        appendLog('File transfer is already in progress.');
        return;
    }

    if (FILE_INPUT.files.length > 0) {
        // Start sending files if files are selected
        setTransferStatus(true);
        conn = getConnection();
        sendFiles(0);
    } else {
        appendLog('Please select a file to send.');
    }
}

// Function to send multiple files to the peer
function sendFiles(index) {
    const file = FILE_INPUT.files[index];
    const fileTransferId = generateFileTransferId();
    const indexInfo = `(${index + 1}/${FILE_INPUT.files.length})`;

    showProgressContainer('Upload', file.name, indexInfo);
    time = new Date();
    transferTime = time;
    const fileCount = FILE_INPUT.files.length;
    const isLastFile = index === fileCount - 1;

    conn.send({
        type: 'ready',
        fileName: file.name,
        indexInfo: indexInfo,
        isLastFile: isLastFile,
        fileCount: fileCount
    });

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
            isLastFile: isLastFile
        };
        sentFileData.set(fileTransferId, fileMap);
        setTimeout(() => sendChunk(fileMap), 0);
    };

    reader.readAsArrayBuffer(file);
}

// Function to send file chunks to the peer
function sendChunk(fileMap) {
    const offset = fileMap.offset;
    const chunk = fileMap.fileData.slice(offset, offset + chunkSize);
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

// Add event listener on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    SEND_BUTTON.addEventListener('click', sendFile);
});

// Function to handle signaling data
export function handleSignal(data) {
    // changeChunkSize(data.sendTime);
    const fileMap = sentFileData.get(data.id);

    updateProgressBar("Upload", data.progress, data.transferRate);
    // updateProgressBar("Upload", data.progress);

    if (fileMap.offset < fileMap.fileSize) {
        // Continue sending chunks if file transfer is incomplete
        setTimeout(() => sendChunk(fileMap), 0);
    } else {
        // File transfer completed
        setTransferStatus(false);
        const index = fileMap.index;
        sentFileData.delete(data.id);

        const timeDiff = new Date() - time;
        const transferRate = calculateTransferRate(fileMap.fileSize, timeDiff);
        appendLog(`File transfer completed in ${timeDiff / 1000} seconds. Transfer rate: ${transferRate} KB/s`);

        if (index + 1 < FILE_INPUT.files.length) {
            // Send the next file if available
            setTimeout(() => sendFiles(index + 1), 0);
        } else {
            // Hide progress container and reset file input
            hideProgressContainer();
            const dataTransfer = new DataTransfer();
            FILE_INPUT.files = dataTransfer.files;
            FILE_LIST_CONTAINER.style.display = 'none';
            chunkSize = INIT_CHUNK_SIZE;

            conn.send({ type: 'transfer_complete', message: 'All files have been successfully transferred!' });

        }
    }
}
