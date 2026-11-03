const {shrimpSVG}=require('./shrimp.js');const fs=require('fs');const path=require('path');
const fred=fs.readdirSync(path.join(__dirname,'../web/vendor/fonts')).filter(f=>f.startsWith('fredoka'));
const ff=fred.map(f=>`@font-face{font-family:Fredoka;font-weight:500 700;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname,'../web/vendor/fonts',f)).toString('base64')}) format('woff2')}`).join('');
// Açılış görseli: şeffaf zemin, ortada karides ve altında yazı. 1200×1200; app.json'da imageWidth ile ölçeklenir.
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><style>${ff}</style>
<g transform="translate(110 70) scale(0.95)">${shrimpSVG({id:'sp'})}</g>
<text x="600" y="1010" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="150" fill="#fff8ea" letter-spacing="2">Neocaridina</text>
</svg>`;
fs.writeFileSync(path.join(__dirname,'splash.svg'),svg);
