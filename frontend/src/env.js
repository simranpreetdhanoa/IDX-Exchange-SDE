// Settings read from frontend/.env (Week 8). Vite only gives the page variables that start with VITE_.
// Kept in its own tiny file: import.meta is a modern-only feature Jest can't read,
// so the tests swap this file for test/envMock.js (see jest.config.js).
const env = {
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
};

export default env;
