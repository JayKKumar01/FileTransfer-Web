import { PREFIX } from './constants.js';
import { getConnection } from './peer-util.js';
import {
    appendLog,
    calculateTransferRate,
    hideProgressContainer,
    updateProgressBar,
    generateFileTransferId,
    showProgressContainer
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

    if (!receivedFileData.has(fileTransferId)) {
        receivedFileData.set(fileTransferId, { blob: new Blob(), totalSize: 0 });
    }

    const fileTransferInfo = receivedFileData.get(fileTransferId);
    fileTransferInfo.blob = new Blob([fileTransferInfo.blob, fileData]);
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
            if (getIsZipSelected() && isMultipleFiles) {
                addToZip(fileName, fileTransferId, fileTransferInfo, isLastFile);
            } else {
                downloadBlob(fileName, fileTransferId, fileTransferInfo);
            }

            hideProgressContainer();
            appendLog("Done!");
        }, 0);
    }
}

function updateSender(id, progress, transferRate) {
    conn.send({
        type: 'signal',
        id: id,
        progress: progress,
        transferRate: transferRate
    });
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

async function downloadBlob(fileName, fileTransferId, fileTransferInfo) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(fileTransferInfo.blob);
    link.download = fileName;
    link.click();
    link.remove();
    fileTransferInfo.blob = null;
    receivedFileData.delete(fileTransferId);
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
