# FileTransfer Web Application - iOS and Android

[GitHub Pages](https://jaykkumar01.github.io/FileTransfer-Web-IOS-Android/)

## Overview

This web application enables peer-to-peer file transfer using PeerJS and is designed to be compatible with both iOS and Android devices. Users can connect with peers, select files for transfer, and monitor the progress of uploads and downloads.

## Live Demo

Visit [FileTransfer Web App: (https://jaykkumar01.github.io/FileTransfer-Web-IOS-Android/)](https://jaykkumar01.github.io/FileTransfer-Web-IOS-Android/) for a live demo.

## Features

- **Peer Connection:**
  - Users can establish a connection by entering their peer ID and the target peer ID.

- **File Selection:**
  - Select and send multiple files to connected peers.

- **Real-time Progress Updates:**
  - Track file transfer progress using a progress bar and text updates.

- **Cross-Platform Compatibility:**
  - Works seamlessly on both iOS and Android devices.

## Functionality

### `connect()`
Establishes a connection with the target peer. Users enter the target peer ID, and the connection is set up using PeerJS.

### `appendLog(log)`
Logs messages to the textarea, providing feedback on various actions and events.

### `showFileTransferWindow()`
Displays the file transfer window upon successful connection.

### `setupConnection(connection)`
Handles the setup of a peer connection when established. Invoked when a connection event is detected.

### `handleConnectionOpen(targetPeerId)`
Handles actions when the connection is open, such as updating logs and showing the file transfer window.

### `handleFileSelection()`
Handles changes in the file input, updating the file list container and displaying selected files.

### `handleFileListClick(event)`
Handles click events on file list items, allowing users to remove selected files.

### `handleData(data)`
Handles data received from the peer, including file data, signaling data, and readiness signals.

### `handleSignal(data)`
Handles signaling data, updating the progress bar based on the signaling information.

### `downloadFile(fileName, fileData)`
Triggers the download of a received file, creating a downloadable link for the user.

### `generateFileTransferId()`
Generates a random ID for file transfer, ensuring uniqueness for each transfer.

### `showProgressContainer(str, fileName, index)`
Displays the progress container during file transfer, updating the filename and progress indicators.

### `updateProgressBar(str, progress)`
Updates the progress bar and text during file transfer, providing real-time progress updates.

### `hideProgressContainer()`
Hides the progress container after a file transfer is completed.

### `sendChunk(fileMap)`
Sends a chunk of a file to the peer during file transfer.

### `sendFile()`
Initiates the file transfer process, sending selected files to the connected peer.

### `sendFiles(index)`
Sends multiple files to the peer, handling each file's transfer sequentially.

### `updateSender(id, progress)`
Sends a progress update to the peer, allowing for synchronized progress tracking.

### `handleFileData(data)`
Handles incoming file data from the peer, aggregating chunks until the complete file is received.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JayKKumar01/FileTransfer-Web-IOS-Android.git
   ```

2. **Open `index.html` in your web browser.**

3. **Enter your peer ID and the target peer ID to establish a connection.**

4. **Select files for transfer and click the "Send File" button.**

5. **Monitor file transfer progress in the progress container.**

## Stack Flow

1. **Frontend:**
   - HTML/CSS for the user interface.
   - JavaScript for handling PeerJS, file transfer logic, and DOM manipulation.
   - PeerJS for establishing peer connections.

2. **Backend:**
   - No server-side logic is required as PeerJS handles the peer-to-peer communication.

3. **PeerJS:**
   - PeerJS library is used for simplifying WebRTC peer-to-peer connections.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.
