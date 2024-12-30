// Importing necessary constants
import { FILE_INPUT, FILE_LIST_CONTAINER, FILE_LIST } from './constants.js';

// Wait for the DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    FILE_INPUT.addEventListener('change', handleFileSelection);
    FILE_LIST.addEventListener('click', handleFileListClick);
});

/**
 * Handles changes in the file input and updates the file list.
 */
async function handleFileSelection() {
    const selectedFiles = Array.from(FILE_INPUT.files);

    // Clear previous file list
    FILE_LIST.innerHTML = '';

    if (selectedFiles.length > 1) {
        FILE_LIST_CONTAINER.style.display = 'block';

        // Use a DocumentFragment for better DOM manipulation performance
        const fragment = document.createDocumentFragment();

        selectedFiles.forEach(file => {
            const listItem = createFileListItem(file.name);
            fragment.appendChild(listItem);
        });

        FILE_LIST.appendChild(fragment);
    } else {
        FILE_LIST_CONTAINER.style.display = 'none';
        FILE_LIST.innerHTML = '<li>No files selected</li>';
    }
}

/**
 * Creates an individual file list item.
 * @param {string} fileName - The name of the file.
 * @returns {HTMLElement} - The list item element.
 */
function createFileListItem(fileName) {
    const listItem = document.createElement('li');
    listItem.textContent = fileName;
    return listItem;
}

/**
 * Handles clicks on file list items to remove a file from the list.
 */
function handleFileListClick(event) {
    const item = event.target;

    if (item.tagName === 'LI') {
        removeFileFromInput(item.textContent.trim());
        item.remove();

        const remainingItems = FILE_LIST.querySelectorAll('li');
        if (remainingItems.length < 2) {
            FILE_LIST_CONTAINER.style.display = 'none';
        }
    }
}

/**
 * Removes the specified file from the file input.
 * @param {string} fileName - The name of the file to remove.
 */
function removeFileFromInput(fileName) {
    const dataTransfer = new DataTransfer();

    Array.from(FILE_INPUT.files).forEach(file => {
        if (file.name !== fileName) {
            dataTransfer.items.add(file);
        }
    });

    FILE_INPUT.files = dataTransfer.files;
}
