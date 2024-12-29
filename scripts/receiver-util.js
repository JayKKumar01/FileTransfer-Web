import { PREFIX } from './constants.js';
import { getConnection } from './peer-util.js';
import {
    appendLog,
    calculateTransferRate,
    hideProgressContainer,
    updateProgressBar,
    generateFileTransferId,
    showProgressContainer,
} from './utils.js';
import { getIsZipSelected } from './zip-util.js';

let isMultipleFiles;
let time;
let transferTime;
let conn;
let jsZip = new JSZip();

const receivedFileData = new Map();

export function ready(data) {
    conn = getConnection();
    showProgressContainer("Download", data.fileName, data.indexInfo);
    time = new Date();
    transferTime = time;
    isMultipleFiles = data.fileCount > 1;
}

export function handleFileData(data) {
    const fileName = data.name;
    const fileData = data.data;
    const fileTransferId = data.id;
    const isLastFile = data.isLastFile;

    // Initialize file data tracking if not already present
    if (!receivedFileData.has(fileTransferId)) {
        receivedFileData.set(fileTransferId, { chunks: [], totalSize: 0 });
    }

    const fileTransferInfo = receivedFileData.get(fileTransferId);
    fileTransferInfo.chunks.push(fileData); // Store incoming chunks
    fileTransferInfo.totalSize += fileData.byteLength;

    const totalSize = data.totalSize;
    const receivedSize = fileTransferInfo.totalSize;
    const progress = Math.floor((receivedSize / totalSize) * 100);

    const timeElapsed = (new Date() - transferTime) / 1000;
    const transferRate = timeElapsed > 0 ? Math.floor((fileData.byteLength / 1024) / timeElapsed) : 0;
    transferTime = new Date();

    updateProgressBar("Download", progress, transferRate);
    updateSender(fileTransferId, progress, transferRate);

    if (receivedSize === totalSize) {
        const timeDiff = new Date() - time;
        const finalRate = calculateTransferRate(totalSize, timeDiff);
        appendLog(`File transfer completed in ${timeDiff / 1000} seconds. Transfer rate: ${finalRate} KB/s`);

        setTimeout(() => {
            finalizeFileHandling(fileName, fileTransferId, fileTransferInfo, isLastFile);
        }, 0);
    }
}

function updateSender(id, progress, transferRate) {
    conn.send({
        type: 'signal',
        id: id,
        progress: progress,
        transferRate: transferRate,
    });
}

async function finalizeFileHandling(fileName, fileTransferId, fileTransferInfo, isLastFile) {
    try {
        // Create a blob from all received chunks
        let blob = new Blob(fileTransferInfo.chunks);

        if (getIsZipSelected() && isMultipleFiles) {
            await addToZip(fileName, blob, isLastFile);
        } else {
            downloadBlob(fileName, blob);
        }

        fileTransferInfo.chunks = null; // Clear memory for this file
        blob = null;
        receivedFileData.delete(fileTransferId);

        if (isLastFile) {
            appendLog("Done! All files have been processed.");
            hideProgressContainer();
        }
    } catch (error) {
        appendLog(`Error processing file ${fileName}: ${error.message}`);
        console.error(`Error finalizing ${fileName}:`, error);
    }
}

async function addToZip(fileName, blob, isLastFile) {
    try {
        jsZip.file(fileName, blob);
        appendLog(`${fileName} successfully added to the zip.`);
        if (isLastFile) {
            zipAndDownload();
        }
    } catch (error) {
        appendLog(`Error while zipping ${fileName}: ${error.message}`);
        console.error(`Error adding ${fileName} to zip:`, error);
    }
}

function downloadBlob(fileName, blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    link.remove();
}

async function zipAndDownload() {
    try {
        appendLog("Generating zip file to download...");
        const zipBlob = await jsZip.generateAsync({ type: 'blob' });
        appendLog("ZIP file generated successfully.");

        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `${PREFIX}${Date.now()}.zip`;

        link.click();

        URL.revokeObjectURL(link.href);
        appendLog("Downloaded all files as ZIP!");
        jsZip = new JSZip();
    } catch (error) {
        appendLog(`Error during zip generation: ${error.message}`);
        console.error("Error generating zip:", error);
    }
}
