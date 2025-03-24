let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let userName = localStorage.getItem('chatUsername') || prompt('Enter your name:');
localStorage.setItem('chatUsername', userName);

const socket = io('http://localhost:3000');

async function loadChatHistory() {
    try {
        const response = await fetch('http://localhost:3000/api/messages');
        const messages = await response.json();
        
        messages.forEach(message => {
            displayMessage(message);
        });
        
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';
    messageHeader.innerHTML = `
        <span>${message.user}</span>
        <span class="message-time">${new Date(message.timestamp).toLocaleString()}</span>
    `;

    messageDiv.appendChild(messageHeader);

    if (message.type === 'text') {
        const messageContent = document.createElement('div');
        messageContent.textContent = message.text;
        messageDiv.appendChild(messageContent);
    } else if (message.type === 'file') {
        const downloadLink = document.createElement('a');
        downloadLink.href = message.fileUrl;
        downloadLink.download = message.fileName || 'file';
        downloadLink.className = 'download-link';
        downloadLink.textContent = `📎 Download ${message.fileName || 'file'}`;
        messageDiv.appendChild(downloadLink);
    } else if (message.type === 'audio') {
        const audioElement = document.createElement('audio');
        audioElement.controls = true;
        audioElement.src = message.fileUrl;
        const downloadLink = document.createElement('a');
        downloadLink.href = message.fileUrl;
        downloadLink.download = `audio-${new Date(message.timestamp).getTime()}.webm`;
        downloadLink.className = 'download-link';
        downloadLink.textContent = '📥 Download Audio';
        messageDiv.appendChild(audioElement);
        messageDiv.appendChild(downloadLink);
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage(text = null, content = null, type = 'text', fileName = null) {
    const messageText = text || messageInput.value;
    if (!messageText && !content) return;

    const message = {
        user: userName,
        text: messageText,
        type,
        fileUrl: content,
        fileName
    };

    if (type === 'audio' || type === 'file') {
        socket.emit('sendMessage', message);
    } else {
        socket.emit('sendMessage', message);
    }

    messageInput.value = '';
}

socket.on('newMessage', (message) => {
    displayMessage(message);
});

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData
        });
        return await response.json();
    } catch (error) {
        console.error('Error uploading file:', error);
        return null;
    }
}

window.onload = () => {
    loadChatHistory();
    
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'message system-message';
    welcomeDiv.innerHTML = `
        <div class="message-header">
            <span>Happy Place Bot</span>
            <span class="message-time">${new Date().toLocaleString()}</span>
        </div>
        <div>Welcome to Happy Place, ${userName}! 🌻</div>
    `;
    chatBox.appendChild(welcomeDiv);
};
