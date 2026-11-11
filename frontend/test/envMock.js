// Pretend version of src/env.js for the tests (Week 8): a fake key, never the real one.
// A test can set env.googleMapsApiKey = '' to check the "no key" message.
const env = {
  googleMapsApiKey: 'test-key',
};

export default env;
