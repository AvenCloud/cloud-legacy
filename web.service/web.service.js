const express = require('express');
const bodyParser = require('body-parser');
const SocketIO = require('socket.io');
const uuid = require('uuid/v1');
const http = require('http');

const startService = async ({ services, port }) => {
  const actions = {
    getServices: async () => {
      return {
        services: await Promise.all(
          services.map(async service => {
            return {
              name: service.name,
              state: service.state,
            };
          }),
        ),
      };
    },
    // subscribeServices: async ({ clientId }) => {},
    // unsubscribeServices: async ({ clientId }) => {},
  };

  const serviceActions = {};
  services.map(s => {
    Object.keys(s.actions).forEach(a => (serviceActions[a] = s.actions[a]));
  });

  const dispatch = async action => {
    if (actions[action.type]) {
      return await actions[action.type](action);
    }
    if (!serviceActions[action.type]) {
      throw new Error(`Action "${action.type} not found!`);
    }
    return await serviceActions[action.type](action);
  };

  const app = express();
  const httpServer = http.createServer(app);
  const io = SocketIO(httpServer);

  const clients = {};

  io.on('connection', socket => {
    socket.emit('news', { hello: 'world' });
    const id = uuid();

    clients[id] = socket;

    socket.on('my other event', data => {
      console.log(data);
    });

    socket.on('');
  });

  app.get('/', (req, res) => {
    res.send('Titan Server 2');
  });

  app.get('/keys.public.txt', (req, res) => {
    res.send(require('fs').readFileSync('/home/bot/.ssh/id_rsa.pub'));
  });

  app.post('/api', bodyParser.json(), async (req, res) => {
    try {
      const result = await dispatch(req.body);
      res.send(JSON.stringify(result));
    } catch (e) {
      const error = { ...e, message: e.message };
      if (!error.message) {
        console.error('Experienced API error without proper formatting!', e);
      }
      res.status(400).send({ error });
    }
  });

  await new Promise((resolve, reject) =>
    app.listen(port, e => {
      if (e) {
        reject(e);
      } else {
        resolve();
      }
    }),
  );

  return {
    close: () => {
      httpServer.close();
    },
    actions,
  };
};

module.exports = { startService };
