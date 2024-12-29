//zip-util.js
// Importing necessary constants and utilities
import { ZIP_TOGGLE} from './constants.js';
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
