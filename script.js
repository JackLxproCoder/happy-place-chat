let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let userName = localStorage.getItem('chatUsername') || prompt('Enter your name:');
localStorage.setItem('chatUsername', userName);

const darkModeToggle = document.getElementById('darkModeToggle');
const recordButton = document.getElementById('recordButton');
const fileInput = document.getElementById('fileInput');
const messageInput = document.getElementById('messageInput');
const chatBox = document.getElementById('chatBox');

darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
});

recordButton.addEventListener('click', async () => {
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            isRecording = true;
            recordButton.textContent = '⏹';

            mediaRecorder.ondataavailable = (e) => {
                audioChunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                sendMessage(null, audioUrl, 'audio');
                audioChunks = [];
                stream.getTracks().forEach(track => track.stop());
            };
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        recordButton.textContent = '🎤';
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            sendMessage(null, e.target.result, 'file', file.name);
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
    }
});

function sendMessage(text = null, content = null, type = 'text') {
    const messageText = text || messageInput.value;
    if (!messageText && !content) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';
    messageHeader.innerHTML = `
        <span>${userName}</span>
        <span class="message-time">${new Date().toLocaleString()}</span>
    `;

    messageDiv.appendChild(messageHeader);

    if (type === 'text') {
        const messageContent = document.createElement('div');
        messageContent.textContent = messageText;
        messageDiv.appendChild(messageContent);
    } else if (type === 'file') {
        const downloadLink = document.createElement('a');
        downloadLink.href = content;
        downloadLink.download = content.name || 'file';
        downloadLink.className = 'download-link';
        downloadLink.textContent = `📎 Download ${content.name || 'file'}`;
        messageDiv.appendChild(downloadLink);
    } else if (type === 'audio') {
        const audioElement = document.createElement('audio');
        audioElement.controls = true;
        audioElement.src = content;
        const downloadLink = document.createElement('a');
        downloadLink.href = content;
        downloadLink.download = `audio-${Date.now()}.webm`;
        downloadLink.className = 'download-link';
        downloadLink.textContent = '📥 Download Audio';
        messageDiv.appendChild(audioElement);
        messageDiv.appendChild(downloadLink);
    }

    chatBox.appendChild(messageDiv);
    messageInput.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
}

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

window.onload = () => {
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'message';
    welcomeDiv.innerHTML = `
        <div class="message-header">
            <span>System</span>
            <span class="message-time">${new Date().toLocaleString()}</span>
        </div>
        <div>Welcome to Happy Place, ${userName}!</div>
    `;
    chatBox.appendChild(welcomeDiv);
};