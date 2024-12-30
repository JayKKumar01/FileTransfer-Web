# FileTransfer Web Application - iOS and Android

[GitHub Pages](https://jaykkumar01.github.io/FileTransfer-Web-IOS-Android/)

## Overview

This web application enables peer-to-peer file transfer using PeerJS and is designed to be compatible with both iOS and Android devices. This is a peer-to-peer file transfer application that enables seamless file sharing between users using a peer-to-peer connection (via PeerJS) and various helper utilities. It also supports sending multiple files, dynamically adjusting file chunk sizes based on transfer speed, and optionally compressing files into a ZIP archive before download.

## Live Demo

Visit [FileTransfer Web App: (https://jaykkumar01.github.io/FileTransfer-Web-IOS-Android/)](https://jaykkumar01.github.io/FileTransfer-Web-IOS-Android/) for a live demo.

Here's a README file template for your GitHub repo, summarizing the main functions based on the eight files in your project:

---

## Features:
- Peer-to-peer file sharing
- Dynamic file chunk size adjustment based on transfer rates
- Option to zip files before downloading
- Supports logging of transfer events and progress
- UI components for managing file input and transfer status

---

## Table of Contents
1. [Technologies](#technologies)
2. [Main Components](#main-components)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Contributing](#contributing)

---

## Technologies

- **PeerJS** for peer-to-peer communication
- **JSZip** for zipping files before download
- **Vanilla JavaScript**, **HTML5**, and **CSS** for frontend functionality
- **FileReader** API for reading file chunks
- **Progressive UI** with real-time transfer logs and progress bars

---

## Main Components

### 1. **peer-util.js**
Handles the peer-to-peer connection logic using PeerJS:
- **peer.on('open')**: Opens a connection and displays the Peer ID.
- **peer.on('connection')**: Handles incoming connections from other peers.
- **connect()**: Initiates a connection to a remote peer using a given Peer ID.
- **setupConnection()**: Sets up a connection once the peer is successfully connected.

### 2. **sender-util.js**
Manages the file sending process between connected peers:
- **sendFile()**: Begins the process of sending files after verifying an active connection.
- **sendFiles()**: Sends files to the connected peer by splitting them into chunks.
- **processNextChunk()**: Reads and sends the next chunk of the file using `FileReader`.
- **adjustChunkSize()**: Dynamically adjusts the chunk size based on the transfer rate, improving the efficiency of the transfer.

### 3. **receiver-util.js**
Handles file reception and managing the transfer's progress:
- **ready()**: Prepares the receiver to handle the incoming files once the sender is ready.
- **handleFileData()**: Receives file data chunks and reconstructs the file.
- **writeToFile()**: Writes received chunks to a file.

### 4. **file-input-util.js**
Manages file selection and rendering:
- **handleFileSelection()**: Handles user file selection and displays a list of selected files in the UI.
- **createFileListItem()**: Creates individual items in the file list for each selected file.
- **handleFileListClick()**: Allows removal of files from the input by clicking on their respective list items.

### 5. **helper.js**
Handles screen locking to prevent screen sleep during transfers:
- **keepScreenAwake()**: Requests a wake lock to prevent the screen from going to sleep, ensuring uninterrupted transfers.

### 6. **utils.js**
Utility functions to manage file transfer data, progress, and logs:
- **appendLog()**: Appends log messages to a textarea element for displaying logs.
- **calculateTransferRate()**: Calculates transfer rate to dynamically adjust file chunk sizes.
- **updateProgressBar()**: Updates the UI with the current progress of the transfer.
- **showProgressContainer()**: Displays the file transfer progress container.
- **generateFileTransferId()**: Generates a unique ID for each file transfer.

### 7. **zip-util.js**
Handles zipping and downloading of files:
- **addToZip()**: Adds files to the zip archive.
- **zipAndDownload()**: Compresses files into a single ZIP file and initiates the download.

### 8. **constants.js**
Contains constants used across the application for referencing UI elements, settings, and global parameters:
- Includes references for elements such as `FILE_LIST`, `SEND_BUTTON`, and progress containers.

---

## Installation

Clone the repository to your local machine:

```bash
git clone https://github.com/JayKKumar01/FileTransfer-Web-IOS-Android.git
```

Ensure all required dependencies are installed (for example, you may need to install `peerjs` and `jszip` via a package manager if using Node.js):

```bash
npm install peerjs jszip
```

---

## Usage

1. **Run the app**: Open the `index.html` file in a browser.
   
2. **Establish a Connection**:
   - Input the **Peer ID** from the log (e.g., `Your ID is: <randomID>`) into another peer's input field and click "Connect".
   
3. **Select Files to Send**:
   - Use the file input to select files for transfer.

4. **Start File Transfer**:
   - Once connected, press the "Send File" button to begin the transfer. The progress will be logged and displayed.

5. **Zip Option** (Optional):
   - Toggle the zip option if you want to download the transferred files as a compressed archive.

---

## Contributing

Feel free to fork this repository, make changes, and submit a pull request. For feature requests or bug reports, please open an issue.
