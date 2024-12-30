// File: constants.js
// SECTION 1: DOM Elements
export const LOGS_TEXTAREA = document.getElementById('logs');
export const TRANSFER_CONTAINER = document.getElementById('transfer-container');
export const ROOM_CONTAINER = document.getElementById('room-container');
export const TARGET_PEER_ID_INPUT = document.getElementById('targetPeerId');
export const CONNECT_BUTTON = document.getElementById('connectButton');
export const FILE_LIST = document.getElementById('fileList');
export const FILE_INPUT = document.getElementById('fileInput');
export const FILE_LIST_CONTAINER = document.getElementById('fileListContainer');
export const PROGRESS_CONTAINER = document.getElementById('progress-container');
export const FILE_NAME_ELEMENT = document.getElementById('fileName');
export const PROGRESS_BAR = document.getElementById('progress-bar');
export const PROGRESS_TEXT = document.getElementById('progress-text');
export const ZIP_TOGGLE = document.getElementById('zipToggle');
export const SEND_BUTTON = document.getElementById('sendButton');

// SECTION 2: Constants
export const PREFIX = "JayKKumar01-File-Transfer-";
export const INIT_CHUNK_SIZE = 1024 * 1024; // Initial chunk size for file transfer
export const RANDOM_ID = Math.floor(100000 + Math.random() * 900000);