const socket = io();

const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatWindow = document.getElementById('chatWindow');
const scrollBtn = document.getElementById('scrollBtn');
const roomSelect = document.getElementById('roomSelect');
const joinRoomBtn = document.getElementById('joinRoom');
const emojiBtn = document.getElementById('emoji-button');
const mediaInput = document.getElementById('mediaInput');
const typingIndicator = document.getElementById('typing-indicator');

const picker = new EmojiButton();
picker.on('emoji', emoji => {
    chatInput.value += emoji;
});
emojiBtn.addEventListener('click', () => {
    picker.togglePicker(emojiBtn);
});

const linkify = (text) => {
    return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
};

chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const message = chatInput.value;
    const file = mediaInput.files[0];

    if (message || file) {
        const reader = new FileReader();
        if (file) {
            reader.onload = () => {
                socket.emit('chatMessage', {
                    message,
                    media: {
                        name: file.name,
                        data: reader.result,
                        type: file.type
                    }
                });
            };
            reader.readAsDataURL(file);
        } else {
            socket.emit('chatMessage', { message });
        }

        chatInput.value = '';
        mediaInput.value = '';
    }
});

socket.on('chatMessage', function(data) {
    const time = new Date(data.time);
    const timeStr = `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<strong>${data.username}</strong> [${timeStr}]: <div>${linkify(data.message)}</div>`;

    if (data.media) {
        const mediaElem = document.createElement(data.media.type.startsWith("video") ? "video" : "img");
        mediaElem.src = data.media.url;
        mediaElem.controls = true;
        mediaElem.style.maxWidth = '100%';
        mediaElem.style.marginTop = '10px';
        div.appendChild(mediaElem);
    }

    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
});

chatInput.addEventListener('input', () => {
    socket.emit('typing');
});

socket.on('typing', (data) => {
    typingIndicator.textContent = `${data.username} is typing...`;
    setTimeout(() => typingIndicator.textContent = '', 2000);
});

joinRoomBtn.addEventListener('click', () => {
    const room = roomSelect.value;
    socket.emit('joinRoom', { room });
});

chatWindow.addEventListener('scroll', () => {
    const nearBottom = chatWindow.scrollHeight - chatWindow.scrollTop <= chatWindow.clientHeight + 100;
    scrollBtn.style.display = nearBottom ? 'none' : 'block';
});

scrollBtn.addEventListener('click', () => {
    chatWindow.scrollTop = chatWindow.scrollHeight;
});
