import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');

const checks=[
  [html.includes('maximum-scale=1.0, user-scalable=no, viewport-fit=cover'),'tablet viewport must not drag or browser-zoom the whole page'],
  [html.includes('id="touchControls" class="touch-controls collapsed"'),'tablet view tools must start collapsed'],
  [html.includes('id="touchToolsToggle"'),'tablet view tools need an explicit expand/collapse control'],
  [css.includes('html.touch-capable,html.touch-capable body{position:fixed'),'touch pages must be fixed against browser overscroll'],
  [css.includes('.touch-capable .battlefield-wrap{touch-action:none'),'the battlefield must own touch gestures'],
  [css.includes('.touch-controls.collapsed>button:not(.touch-tools-toggle)'),'collapsed tools must hide the obstructing buttons'],
  [game.includes("if(!touchPoints.size){updateBgRect()"),'adding a second finger must not recalculate and jump the camera'],
  [game.includes("wrap.addEventListener('touchmove'"),'native page dragging must be cancelled over the battlefield'],
  [game.includes("e.pointerType==='mouse'"),'touch and pen gestures must share the tablet path']
];

for(const[ok,message]of checks)if(!ok)throw new Error(message);
console.log('Tablet touch verified: collapsed tools, fixed viewport, one-finger pan and stable two-finger pinch are wired.');
