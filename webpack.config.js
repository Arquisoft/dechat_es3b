const path = require('path');

module.exports = {
  entry: {
    login: './web-app/login.js',
    createChat: './web-app/createChat.js',
    main: './web-app/index.js'  
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'web-app/dist')
  },
  mode: 'development',
  externals: {
    'node-fetch': 'fetch',
    'text-encoding': 'TextEncoder',
    'whatwg-url': 'window',
    'isomorphic-fetch': 'fetch',
    '@trust/webcrypto': 'crypto',
    'fs': 'empty'
  }
};
