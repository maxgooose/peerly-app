// Matrix rain effect on background (subtle)
function createMatrixRain() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-1';
    canvas.style.opacity = '0.1';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = '01アイウエオカキクケコサシスセソタチツテト'.split('');
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function draw() {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00ff00';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    setInterval(draw, 50);

    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Typing effect for tagline
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    element.style.borderRight = '2px solid #00ff00';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            setTimeout(() => {
                element.style.borderRight = 'none';
            }, 500);
        }
    }
    
    type();
}

// Glitch effect on hover
function addGlitchEffect(element) {
    element.addEventListener('mouseenter', () => {
        const original = element.textContent;
        const chars = '!<>-_\\/[]{}—=+*^?#________';
        let iteration = 0;
        
        const interval = setInterval(() => {
            element.textContent = original
                .split('')
                .map((char, index) => {
                    if (index < iteration) {
                        return original[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('');
            
            if (iteration >= original.length) {
                clearInterval(interval);
            }
            
            iteration += 1 / 3;
        }, 30);
    });
}

// ASCII art animation variants
const nestArtVariants = [
    `
                .-"""-. 
               /       \\
              |  O   O  |
              |    ^    |     Find your
               \\  \\_/  /      study squad
                '-._.-'
               __|    |__
              /          \\
             |  ~  ~  ~  |
             |  ~  ~  ~  |
              \\__________/
    `,
    `
                .-"""-. 
               /       \\
              |  ^   ^  |
              |    v    |     Find your
               \\  \\_/  /      study squad
                '-._.-'
               __|    |__
              /          \\
             |  ~  ~  ~  |
             |  ~  ~  ~  |
              \\__________/
    `
];

let currentArtIndex = 0;
function animateNest() {
    const nestArt = document.getElementById('nest-art');
    if (nestArt) {
        setInterval(() => {
            currentArtIndex = (currentArtIndex + 1) % nestArtVariants.length;
            nestArt.textContent = nestArtVariants[currentArtIndex];
        }, 2000);
    }
}

// Easter egg: Konami code
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        document.body.style.animation = 'rainbow 2s linear infinite';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 5000);
    }
});

// Rainbow animation for easter egg
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Coming soon notification
document.getElementById('coming-soon')?.addEventListener('click', (e) => {
    e.preventDefault();
    const btn = e.currentTarget;
    const originalText = btn.querySelector('.btn-text').textContent;
    
    btn.querySelector('.btn-text').textContent = 'Soon™';
    btn.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        btn.querySelector('.btn-text').textContent = originalText;
        btn.style.transform = '';
    }, 1000);
});

// Cursor trail effect
const trail = [];
const trailLength = 20;

document.addEventListener('mousemove', (e) => {
    trail.push({ x: e.clientX, y: e.clientY, time: Date.now() });
    
    if (trail.length > trailLength) {
        trail.shift();
    }
    
    // Clean up old trails
    trail.forEach((point, index) => {
        if (Date.now() - point.time > 1000) {
            trail.splice(index, 1);
        }
    });
});

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Start matrix rain effect
    createMatrixRain();
    
    // Animate nest ASCII art
    animateNest();
    
    // Add glitch effect to title
    const title = document.querySelector('.tagline');
    if (title) {
        const originalText = title.textContent;
        addGlitchEffect(title);
    }
    
    // Add console message
    console.log(`
    ███╗   ██╗███████╗███████╗████████╗███████╗
    ████╗  ██║██╔════╝██╔════╝╚══██╔══╝██╔════╝
    ██╔██╗ ██║█████╗  ███████╗   ██║   ███████╗
    ██║╚██╗██║██╔══╝  ╚════██║   ██║   ╚════██║
    ██║ ╚████║███████╗███████║   ██║   ███████║
    ╚═╝  ╚═══╝╚══════╝╚══════╝   ╚═╝   ╚══════╝
    
    👋 Hey there, curious developer!
    Welcome to Nests - where students connect and grow together.
    
    Built with ♥ and lots of ASCII art.
    `);
});

// Smooth scroll for any future anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    });
});

