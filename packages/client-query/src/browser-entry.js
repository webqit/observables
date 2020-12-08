
/**
 * @imports
 */
import { build } from '../../../src/build.js';
import * as ClientQuery from './index.js';

// As globals
window.WQ = window.WQ || {};
window.WQ.Obsv = build('ClientQuery', ClientQuery);