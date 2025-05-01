// Use createRequire so we can load the CJS helper
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Require the CJS file
const zego = require('./zegoServerAssistant.cjs');

// Depending on how it was exported, pull out the function:
const generateToken04 = zego.default || zego;

export { generateToken04 };
