/**
 * Trigger CSS-based confetti celebration
 * @param {object} options
 * @param {number} options.count - Number of pieces
 */
export const triggerConfetti = ({ count = 40 } = {}) => {
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';

        // Randomize
        const colors = ['#D97706', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#FFD700'];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = (Math.random() * 8 + 4) + 'px';
        confetti.style.height = (Math.random() * 15 + 5) + 'px';
        confetti.style.animationDelay = (Math.random() * 2) + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';

        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
};
