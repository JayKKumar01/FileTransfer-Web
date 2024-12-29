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

const INIT_CHUNK_SIZE = 1024 * 64; // Initial chunk size: 1MB
let chunkSize = INIT_CHUNK_SIZE;
let isFileBeingTransferred = false;
const sentFileData = new Map(); // Tracks all files being sent
let conn;
let time;

function setTransferStatus(status) {
    isFileBeingTransferred = status;
}

function sendFile() {
    if (isFileBeingTransferred) {
        appendLog('File transfer is already in progress.');
        return;
    }

    if (FILE_INPUT.files.length > 0) {
        conn = getConnection();
        if (!conn) {
            appendLog('No connection available. Please connect to a peer first.');
            return;
        }

        setTransferStatus(true);
        sendFiles(0);
    } else {
        appendLog('Please select a file to send.');
    }
}

function sendFiles(index) {
    const files = FILE_INPUT.files;
    if (!files[index]) return;

    const file = files[index];
    const fileTransferId = generateFileTransferId();
    const indexInfo = `(${index + 1}/${files.length})`;
    const isLastFile = index === files.length - 1;

    // Notify peer of the upcoming transfer
    conn.send({
        type: 'ready',
        fileName: file.name,
        indexInfo,
        isFirstFile: index === 0,
        isLastFile,
        fileCount: files.length
    });

    showProgressContainer('Upload', file.name, indexInfo);
    time = new Date();

    const fileMap = {
        index,
        fileTransferId,
        file,
        offset: 0,
        fileName: file.name,
        fileSize: file.size,
        isLastFile
    };

    sentFileData.set(fileTransferId, fileMap);
    processNextChunk(fileMap);
}

function processNextChunk(fileMap) {
    const { file, offset, fileSize } = fileMap;

    if (offset >= fileSize) return; // Avoid redundant sends

    const chunk = file.slice(offset, offset + chunkSize);
    const reader = new FileReader();

    reader.onload = (event) => {
        const chunkData = event.target.result;

        conn.send({
            type: 'file',
            id: fileMap.fileTransferId,
            data: chunkData,
            name: fileMap.fileName,
            offset: fileMap.offset,
            totalSize: fileMap.fileSize,
            isLastFile: fileMap.isLastFile
        });

        fileMap.offset += chunkData.byteLength; // Update offset
    };

    reader.onerror = (error) => {
        console.error('Error reading file chunk:', error);
    };

    reader.readAsArrayBuffer(chunk); // Read the next chunk
}

// Adjust chunk size based on the transfer rate in KB/s
function adjustChunkSize(transferRate) {
    const MIN_CHUNK_SIZE = 1024 * 64;  // Minimum chunk size: 64KB (in bytes)
    const MAX_CHUNK_SIZE = 1024 * 1024; // Maximum chunk size: 1MB (in bytes)

    // Calculate chunk size based on transfer rate (in KB/s), multiply by 1024 to convert to bytes
    const calculatedChunkSize = Math.floor((transferRate * 1024) / 3);

    // Set the chunk size, constrained by the MIN and MAX values (in bytes)
    chunkSize = Math.max(MIN_CHUNK_SIZE, Math.min(calculatedChunkSize, MAX_CHUNK_SIZE));

    // Optional logging to keep track of chunk size changes (for debugging purposes)
    console.log(`Dynamic Chunk Size Adjusted: ${chunkSize / 1024} KB at Transfer Rate: ${transferRate} KB/s`);
}

export function handleSignal(data) {
    const fileMap = sentFileData.get(data.id);
    if (!fileMap) {
        appendLog('Unexpected file transfer ID in signal.');
        return;
    }

    // Update progress
    updateProgressBar('Upload', data.progress, data.transferRate);

    // Adjust chunk size based on the received transfer rate in KB/s
    adjustChunkSize(data.transferRate);

    if (fileMap.offset < fileMap.fileSize) {
        // Continue transfer
        processNextChunk(fileMap);
    } else {
        // Completed transfer for this file
        finalizeTransfer(fileMap, data.id);
    }
}

function finalizeTransfer(fileMap, id) {
    setTransferStatus(false);
    const timeDiff = new Date() - time;
    const transferRate = calculateTransferRate(fileMap.fileSize, timeDiff);
    appendLog(`File ${fileMap.fileName} completed in ${timeDiff / 1000}s. Rate: ${transferRate} KB/s`);

    const index = fileMap.index;
    sentFileData.delete(id);

    if (index + 1 < FILE_INPUT.files.length) {
        sendFiles(index + 1); // Start next file
    } else {
        transferComplete();
    }
}

function transferComplete() {
    hideProgressContainer();
    FILE_INPUT.files = new DataTransfer().files; // Reset file input
    FILE_LIST_CONTAINER.style.display = 'none';
    chunkSize = INIT_CHUNK_SIZE;

    conn.send({ type: 'transfer_complete', message: 'All files successfully transferred!' });
    appendLog('All files have been transferred!');
}

// Event listener setup
document.addEventListener('DOMContentLoaded', () => {
    SEND_BUTTON.addEventListener('click', sendFile);
});
