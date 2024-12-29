//file-input-util.js
// Importing necessary constants
import { FILE_INPUT, FILE_LIST_CONTAINER, FILE_LIST } from './constants.js';

// Wait for the DOM content to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners for file input and file list
    FILE_INPUT.addEventListener('change', handleFileSelection);
    FILE_LIST.addEventListener('click', handleFileListClick);
});

// Event handler for file selection changes
async function handleFileSelection() {
    const selectedFiles = FILE_INPUT.files;

    // Clear the file list content
    FILE_LIST.innerHTML = '';

    if (selectedFiles.length > 1) {
        // Display selected files in the file list container
        FILE_LIST_CONTAINER.style.display = 'block';
        for (let i = 0; i < selectedFiles.length; i++) {
            const fileName = selectedFiles[i].name;
            const listItem = document.createElement('li');
            listItem.textContent = fileName;
            FILE_LIST.appendChild(listItem);
        }
    } else {
        // Hide file list container if no or a single file is selected
        FILE_LIST_CONTAINER.style.display = 'none';
        FILE_LIST.innerHTML = '<li>No files selected</li>';
    }
}

// Event handler for file list item click events
function handleFileListClick(event) {
    const item = event.target;
    const fileListItems = document.querySelectorAll('#fileList li');

    fileListItems.forEach((listItem) => {
        if (item == listItem) {
            // Remove the clicked file from the list and update the file input
            item.remove();
            const fileName = item.textContent.trim();
            const dataTransfer = new DataTransfer();

            Array.from(FILE_INPUT.files).forEach((file) => {
                if (file.name !== fileName) {
                    dataTransfer.items.add(file);
                }
            });

            FILE_INPUT.files = dataTransfer.files;
        }
    });

    if (fileListItems.length < 2) {
        // Hide the file list container if less than 2 files are present
        FILE_LIST_CONTAINER.style.display = 'none';
    }
}
