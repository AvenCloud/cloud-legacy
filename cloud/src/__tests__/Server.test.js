import Server from '../server';
import fetch from 'node-fetch';
const WebSocket = require('ws');

let server = null;
beforeEach(async () => {
  server = await Server({ PORT: 8989 });
});

afterEach(async () => {
  await server.remove();
  server = null;
});

test('server launches and responds positively', async () => {
  const res = await fetch('http://localhost:8989');

  expect(res.status).toBe(200);
});

test('server can handle action dispatches', async () => {
  const res = await fetch('http://localhost:8989/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'DebugInfo',
    }),
  });
  const response = await res.json();

  expect(typeof response).toEqual('object');
  expect(response.isHTTPS).toEqual(false);
});

test('websocket server launches and connects', async () => {
  const ws = new WebSocket('ws://localhost:8989');

  let firstMessage = null;
  let firstMessageResolver = null;
  ws.on('message', message => {
    if (!firstMessage) {
      firstMessage = message;
      firstMessageResolver && firstMessageResolver(firstMessage);
    }
  });

  await new Promise((resolve, reject) => {
    ws.on('open', () => {
      resolve();
    });
    setTimeout(reject, 1000);
  });

  await new Promise((resolve, reject) => {
    if (firstMessage) {
      resolve(firstMessage);
    } else {
      firstMessageResolver = resolve;
    }
    setTimeout(reject, 1000);
  });

  expect(typeof firstMessage).toBe('string');
  const msg = JSON.parse(firstMessage);
  expect(msg.type).toBe('ClientId');
  expect(typeof msg.clientId).toBe('string');

  ws.close();
});

test('websocket server handles dispatches', async () => {
  const ws = new WebSocket('ws://localhost:8989');

  let messages = [];
  let nextMessageResolver = null;
  ws.on('message', message => {
    messages.push(JSON.parse(message));
    nextMessageResolver && nextMessageResolver();
  });

  await new Promise((resolve, reject) => {
    ws.on('open', () => {
      resolve();
    });
    setTimeout(reject, 1000);
  });

  ws.send(
    JSON.stringify({
      type: 'DebugInfo',
      requestId: 'abc123',
    }),
  );

  await new Promise((resolve, reject) => {
    if (messages.length === 2) {
      resolve();
    } else {
      nextMessageResolver = resolve;
    }
    setTimeout(reject, 1000);
  });

  expect(messages.length).toBe(2);
  expect(messages[1].type).toBe('ActionResponse');
  expect(messages[1].requestId).toBe('abc123');
  expect(messages[1].result.isHTTPS).toBe(false);

  ws.close();
});
