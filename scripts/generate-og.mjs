import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const width = 1200;
const height = 630;

const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0e18"/>
      <stop offset="100%" stop-color="#111830"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="neonGlow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bg)"/>

  <!-- Subtle grid pattern -->
  <g opacity="0.04">
    ${Array.from({length: 30}, (_, i) => `<line x1="${i * 40}" y1="0" x2="${i * 40}" y2="${height}" stroke="#ffd700" stroke-width="1"/>`).join('\n    ')}
    ${Array.from({length: 16}, (_, i) => `<line x1="0" y1="${i * 40}" x2="${width}" y2="${i * 40}" stroke="#ffd700" stroke-width="1"/>`).join('\n    ')}
  </g>

  <!-- Gold border with corners -->
  <rect x="24" y="24" width="1152" height="582" rx="6" fill="none" stroke="#ffd700" stroke-width="1.5" opacity="0.6"/>
  <rect x="30" y="30" width="1140" height="570" rx="4" fill="none" stroke="#ffd700" stroke-width="0.5" opacity="0.2"/>

  <!-- VHS Tape icon (left side) -->
  <g transform="translate(80, 210)">
    <!-- VHS cassette body -->
    <rect x="0" y="0" width="160" height="100" rx="6" fill="#1a1a2a" stroke="#ffd700" stroke-width="2"/>
    <!-- Label area -->
    <rect x="10" y="8" width="140" height="50" rx="3" fill="#1a2a50"/>
    <text x="80" y="30" font-family="Courier New, monospace" font-size="10" fill="#ffd700" text-anchor="middle" font-weight="bold">FRIDAY NIGHT</text>
    <text x="80" y="46" font-family="Courier New, monospace" font-size="10" fill="#ffd700" text-anchor="middle" font-weight="bold">VIDEO</text>
    <!-- Reels -->
    <circle cx="55" cy="78" r="14" fill="#0a0e18" stroke="#333" stroke-width="1.5"/>
    <circle cx="55" cy="78" r="6" fill="none" stroke="#444" stroke-width="1"/>
    <circle cx="105" cy="78" r="14" fill="#0a0e18" stroke="#333" stroke-width="1.5"/>
    <circle cx="105" cy="78" r="6" fill="none" stroke="#444" stroke-width="1"/>
    <!-- Tape window -->
    <rect x="40" y="62" width="80" height="32" rx="2" fill="none" stroke="#333" stroke-width="1"/>
  </g>

  <!-- Title text -->
  <text x="300" y="240" font-family="Courier New, monospace" font-size="58" font-weight="bold" fill="#ffd700" filter="url(#glow)">FRIDAY NIGHT</text>
  <text x="300" y="300" font-family="Courier New, monospace" font-size="58" font-weight="bold" fill="#ffd700" filter="url(#glow)">VIDEO</text>

  <!-- Tagline -->
  <text x="302" y="340" font-family="Courier New, monospace" font-size="18" fill="#999999" letter-spacing="3">YOUR NEIGHBORHOOD VIDEO STORE</text>

  <!-- Gold divider line -->
  <line x1="300" y1="360" x2="850" y2="360" stroke="#ffd700" stroke-width="1" opacity="0.3"/>

  <!-- Description lines -->
  <text x="300" y="395" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#777777">Browse the shelves. Pick a movie. Chat with Vinny.</text>
  <text x="300" y="420" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#777777">It's Friday night, 1992.</text>

  <!-- Play button -->
  <g transform="translate(300, 455)">
    <rect x="-5" y="-18" width="310" height="28" rx="4" fill="#ffd700" opacity="0.08"/>
    <text x="0" y="0" font-family="Courier New, monospace" font-size="15" fill="#ffd700" filter="url(#glow)">&#9654; PLAY FREE IN YOUR BROWSER</text>
  </g>

  <!-- URL -->
  <text x="300" y="500" font-family="Courier New, monospace" font-size="13" fill="#555555">fridaynightvideo.app</text>

  <!-- Neon OPEN sign (top right corner) -->
  <g transform="translate(1020, 60)">
    <rect x="0" y="0" width="100" height="40" rx="4" fill="none" stroke="#ff3e7a" stroke-width="2" filter="url(#neonGlow)" opacity="0.8"/>
    <text x="50" y="27" font-family="Courier New, monospace" font-size="18" fill="#ff3e7a" text-anchor="middle" font-weight="bold" filter="url(#neonGlow)">OPEN</text>
  </g>

  <!-- Small decorative stars -->
  <text x="1050" y="140" font-size="10" fill="#ffd700" opacity="0.3">&#9733;</text>
  <text x="1090" y="120" font-size="7" fill="#ffd700" opacity="0.2">&#9733;</text>
  <text x="1070" y="160" font-size="5" fill="#ffd700" opacity="0.15">&#9733;</text>
</svg>`;

const outDir = path.resolve('public/images');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, 'og-share.png'));
console.log('Generated public/images/og-share.png (1200x630)');
