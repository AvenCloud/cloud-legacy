import app from './server';
import { config } from './config';
import http from 'http';

const server = http.createServer(app);

let currentApp = app;

server.listen(config.PORT, error => {
  if (error) {
    console.log(error);
    return;
  }

  console.log(`Started instance ${config.INSTANCE_ID} on port ${config.PORT}`);
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
