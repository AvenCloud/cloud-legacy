import app from './server';
import http from 'http';

require('dotenv').config();

const server = http.createServer(app);

let currentApp = app;

const port = 8080; // I don't want to hardcode this but GAE refuses to work..

console.log('process.env.CLOUD_HTTP_PORT : ' + process.env.CLOUD_HTTP_PORT);
console.log('process.env.PORT : ' + process.env.PORT);
console.log('Unfortunately opening the hardcoded port ' + port);
// const port = process.env.CLOUD_HTTP_PORT || process.env.PORT;

server.listen(port, error => {
  if (error) {
    console.log(error);
  }

  console.log('App started on ' + port);
});

if (module.hot) {
  console.log('✅  Server-side HMR Enabled!');

  module.hot.accept('./server', () => {
    console.log('🔁  HMR Reloading `./server`...');
    server.removeListener('request', currentApp);
    const newApp = require('./server').default;
    server.on('request', newApp);
    currentApp = newApp;
  });
}
