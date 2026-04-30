
// Whimsical Artisanal Butterflies for The Worn Pages Club
function initSanctuaryButterflies() {
    const field = document.createElement('div');
    field.className = 'butterfly-field';
    document.body.appendChild(field);

    const style = document.createElement('style');
    style.textContent = `
        .butterfly-field {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
            z-index: 1;
            overflow: hidden;
        }
        .butterfly-drift {
            position: absolute;
            width: 40px;
            height: 40px;
            opacity: 0.6;
            animation: globalButterflyDrift linear infinite;
            mix-blend-mode: multiply;
            background-size: contain;
            background-repeat: no-repeat;
            z-index: 1;
        }
        @keyframes globalButterflyDrift {
            0% { transform: translate(-100px, 110vh) rotate(0deg) scale(0.8); }
            50% { transform: translate(50vw, 50vh) rotate(180deg) scale(1.2); }
            100% { transform: translate(110vw, -100px) rotate(360deg) scale(0.8); }
        }
    `;
    document.head.appendChild(style);

    function createButterfly() {
        const b = document.createElement('div');
        const type = Math.floor(Math.random() * 3) + 1;
        b.className = 'butterfly-drift';
        b.style.backgroundImage = `url('/assets/butterfly_${type}.png')`;
        
        const duration = Math.random() * 20 + 30;
        b.style.animationDuration = `${duration}s`;
        b.style.left = `${Math.random() * 100}%`;
        b.style.top = `${Math.random() * 100}%`;
        
        field.appendChild(b);
        setTimeout(() => b.remove(), duration * 1000);
    }

    // Initial flock
    for(let i=0; i<4; i++) setTimeout(createButterfly, i * 2000);
    
    // Continuous drifting
    setInterval(createButterfly, 6000);
}

document.addEventListener('DOMContentLoaded', initSanctuaryButterflies);
