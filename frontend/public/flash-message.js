
// flash-message.js
class FlashMessage {
    constructor() {
        this.messageContainer = this.createMessageContainer();
        document.body.appendChild(this.messageContainer);
    }

    createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'flash-message-container';
        return container;
    }

    show(message, type = 'info', duration = 5000) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('flash-message', `flash-message-${type}`);
        messageElement.innerHTML = `
            <p>${message}</p>
            <button class="close-button">&times;</button>
        `;

        this.messageContainer.appendChild(messageElement);

        // Auto-dismiss
        const timeoutId = setTimeout(() => {
            this.dismiss(messageElement);
        }, duration);

        // Dismiss on close button click
        messageElement.querySelector('.close-button').addEventListener('click', () => {
            clearTimeout(timeoutId); // Clear auto-dismiss timeout
            this.dismiss(messageElement);
        });
    }

    dismiss(messageElement) {
        messageElement.classList.add('dismissing');
        messageElement.addEventListener('animationend', () => {
            messageElement.remove();
        }, { once: true });
    }
}

// Export a singleton instance
const flashMessage = new FlashMessage();
window.showFlashMessage = (message, type, duration) => flashMessage.show(message, type, duration);
