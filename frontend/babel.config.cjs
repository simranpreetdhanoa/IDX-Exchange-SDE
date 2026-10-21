// Used only by Jest, to turn JSX and `import` into code Jest can run. Vite doesn't use this file.
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
