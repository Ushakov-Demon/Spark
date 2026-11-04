/**
 * The Professor walking while the page loads: a module of its own and a light one (the drawing alone), so it is on
 * the screen before the lab's code has come. main.ts takes it away when the page has loaded whole.
 */
import { professorSideSvg } from './graphics/professor/side.js';

const box = document.getElementById('preloader');
if (box) box.innerHTML = `<div class="preloader-walk">${professorSideSvg('neutral', 120)}</div><div class="preloader-floor"></div>`;
