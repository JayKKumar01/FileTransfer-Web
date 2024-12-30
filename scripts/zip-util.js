//zip-util.js
// Importing necessary constants and utilities
import { PREFIX, ZIP_TOGGLE, SAVE_BUTTON} from './constants.js';
import { appendLog } from './utils.js';

let isZipSelected = true;

// Handle the state change when the checkbox is toggled
ZIP_TOGGLE.addEventListener('change', function () {
    isZipSelected = this.checked;
    appendLog(`Zip download is ${isZipSelected ? 'enabled' : 'disabled'}`);
});

export function getIsZipSelected(){
    return isZipSelected;
}

let jsZip;

export function resetZip(){
    jsZip = new JSZip();
}

export async function addToZip(fileName, blob, isLastFile) {
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

// Attach the file-saving logic to a user action
SAVE_BUTTON.addEventListener('click', async () => {
    try {
        appendLog("Generating ZIP file...");
        const zipBlob = await jsZip.generateAsync({ type: 'blob' });

        appendLog("Prompting user to save ZIP file...");
        const handle = await window.showSaveFilePicker({
            suggestedName: `${PREFIX}${Date.now()}.zip`,
            types: [{ description: "ZIP File", accept: { "application/zip": [".zip"] } }],
        });

        const writable = await handle.createWritable();
        appendLog("Saving ZIP file...");
        await writable.write(zipBlob);
        await writable.close();
        appendLog("Downloaded all files as ZIP!");
    } catch (error) {
        console.error("Failed to save ZIP file:", error);
        appendLog("Error during ZIP file saving.");
    }
});


async function zipAndDownload() {
    if ('showSaveFilePicker' in window) {
        appendLog("Click on Save Button");
    } else {
        appendLog("Save File Picker API not supported, falling back to blob URL...");
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
        } catch (error) {
            appendLog(`Error during zip generation: ${error.message}`);
            console.error("Error generating zip:", error);
        }
    }
    
    
}
