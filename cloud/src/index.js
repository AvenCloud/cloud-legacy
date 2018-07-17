import server from './server';

let serverInstance = null;

server().then(instance => {
  serverInstance = instance;
});

if (module.hot) {
  console.log('✅  Server-side HMR Enabled!');

  module.hot.accept('./server', async () => {
    console.log('🔁  HMR Reloading `./server`...');
    serverInstance.remove();
    const newServer = require('./server').default;
    serverInstance = await newServer();
  });
}
