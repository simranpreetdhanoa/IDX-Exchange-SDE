// Jest's pretend browser (jsdom) has no TextEncoder/TextDecoder, but React Router needs them (Week 8).
// Borrow Node's own versions before any test file loads.
const { TextEncoder, TextDecoder } = require('node:util');
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
