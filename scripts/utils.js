// File: utils.js
import {
    LOGS_TEXTAREA,
    PROGRESS_BAR,
    PROGRESS_TEXT,
    PROGRESS_CONTAINER,
    TRANSFER_CONTAINER,
    ZIP_TOGGLE,
    FILE_NAME_ELEMENT
} from './constants.js';

export function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
}

export function appendLog(log) {
    LOGS_TEXTAREA.value += `${log}\n`;
    LOGS_TEXTAREA.scrollTop = LOGS_TEXTAREA.scrollHeight;
}

export function calculateTransferRate(fileSize, timeDiff) {
    if(timeDiff === 0){
        return 0;
    }
    return ((fileSize / 1024) / (timeDiff / 1000)).toFixed(2);
}

export function toggleContainers(visibleContainer, hiddenContainers) {
    visibleContainer.style.display = 'block';
    hiddenContainers.forEach(container => container.style.display = 'none');
}

export function updateProgressBar(str, progress, transferRate) {
    PROGRESS_BAR.style.width = `${progress}%`;
    PROGRESS_TEXT.textContent = `${str}: ${progress}% (${transferRate} KB/s)`;
}

export function hideProgressContainer() {
    PROGRESS_CONTAINER.style.display = 'none';
    TRANSFER_CONTAINER.style.display = 'block';
}

export function generateFileTransferId() {
    return Math.floor(100000 + Math.random() * 900000);
}

/**
 * Function to display the progress container for file transfer
 * @param {string} status - The status of the operation, e.g., 'Upload' or 'Download'.
 * @param {string} fileName - The name of the file being transferred.
 * @param {string} index - The file index, formatted as "(current/total)".
 */
export function showProgressContainer(status, fileName, index) {
    // Set file name and index in the UI
    FILE_NAME_ELEMENT.textContent = `${index}: ${fileName}`;

    // Display progress container and hide transfer container
    PROGRESS_CONTAINER.style.display = 'block';
    TRANSFER_CONTAINER.style.display = 'none';

    // Initialize the progress bar
    PROGRESS_BAR.style.width = '0%';
    PROGRESS_TEXT.textContent = `${status}: 0%`;

    // Log file transfer initiation
    appendLog(`${index}: File transfer started: ${fileName}`);
}