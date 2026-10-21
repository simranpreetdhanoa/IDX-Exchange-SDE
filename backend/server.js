// Starts the API. The app itself is built in app.js, so tests can use it
// without starting a real server on port 5000.
const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
