(function() {
    // 1. INJECT CSS STYLES (So it works on Admin pages too)
    const style = document.createElement('style');
    style.innerHTML = `
        .cursor-trail {
            position: fixed;
            top: 0;
            left: 0;
            width: 6px;
            height: 6px;
            background: rgba(63, 243, 231, 0.8);
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            box-shadow: 0 0 10px #3ff3e7, 0 0 20px #3ff3e7;
            transform: translate(-50%, -50%);
            animation: trailFade 1s linear forwards;
        }
        @keyframes trailFade {
            0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
        }
    `;
    document.head.appendChild(style);

    // 2. MOUSE LOGIC
    document.addEventListener('mousemove', function(e) {
        // Limit density (40% chance to spawn)
        if (Math.random() > 0.4) return;

        const particle = document.createElement('div');
        particle.classList.add('cursor-trail');
        
        particle.style.left = e.clientX + 'px';
        particle.style.top = e.clientY + 'px';
        
        const size = Math.random() * 4 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        document.body.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 1000);
    });
})();