/**
 * The page's start: the texts of the language it opens in, then the lab (everything in it may word a message as it
 * loads). The walking Professor (preloader.ts) is on the screen meanwhile.
 */
import { loadLocale, openingLocale } from './locales.js';

void loadLocale(openingLocale()).then(() => import('./main.js'));
