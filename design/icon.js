const {shrimpSVG}=require('./shrimp.js');const fs=require('fs');
function icon(){return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs><radialGradient id="bg" cx=".5" cy=".25" r=".9"><stop offset="0" stop-color="#2a8a8c"/><stop offset=".55" stop-color="#11505a"/><stop offset="1" stop-color="#082a33"/></radialGradient>
<linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff3e8" stop-opacity=".35"/><stop offset="1" stop-color="#bff3e8" stop-opacity="0"/></linearGradient>
<linearGradient id="moss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fbf4a"/><stop offset="1" stop-color="#2f6b26"/></linearGradient></defs>
<rect width="1024" height="1024" fill="url(#bg)"/>
<g opacity=".9"><path d="M300 0 L 380 0 L 250 760 L 140 760 Z" fill="url(#ray)"/><path d="M560 0 L 620 0 L 560 700 L 470 700 Z" fill="url(#ray)" opacity=".7"/><path d="M800 0 L 860 0 L 900 640 L 810 640 Z" fill="url(#ray)" opacity=".6"/></g>
<g fill="#d9fbff" opacity=".55"><circle cx="190" cy="250" r="16"/><circle cx="225" cy="180" r="10"/><circle cx="205" cy="120" r="7"/><circle cx="860" cy="560" r="12"/><circle cx="880" cy="500" r="8"/></g>
<path d="M0 850 C 120 800, 230 830, 330 860 C 460 900, 620 820, 760 850 C 880 875, 960 840, 1024 830 L 1024 1024 L 0 1024 Z" fill="#1e3d22"/>
<g fill="url(#moss)" stroke="#24521f" stroke-width="5"><ellipse cx="140" cy="905" rx="170" ry="80"/><ellipse cx="420" cy="940" rx="200" ry="80"/><ellipse cx="760" cy="920" rx="190" ry="85"/><ellipse cx="980" cy="910" rx="140" ry="70"/></g>
<g fill="#86d05c" opacity=".75">${Array.from({length:70},(_, i)=>{const x=(i*137)%1024,y=860+((i*53)%70);return `<circle cx="${x}" cy="${y}" r="${7+(i%4)*3}"/>`;}).join('')}</g>
<g fill="#2c6427" opacity=".55">${Array.from({length:50},(_, i)=>{const x=(i*211+40)%1024,y=905+((i*37)%90);return `<circle cx="${x}" cy="${y}" r="${6+(i%3)*3}"/>`;}).join('')}</g>
<g fill="#3f8a33" stroke="#24521f" stroke-width="6"><path d="M90 860 C 60 700, 120 620, 150 560 C 170 660, 150 760, 120 860 Z"/><path d="M150 870 C 170 740, 240 690, 290 650 C 270 750, 220 820, 190 875 Z"/><path d="M880 860 C 900 740, 960 690, 1000 660 C 990 760, 950 820, 920 870 Z"/></g>
<g transform="translate(40 10) scale(0.94)">${shrimpSVG()}</g>
</svg>`;}
fs.writeFileSync(__dirname+'/icon.svg',icon());
