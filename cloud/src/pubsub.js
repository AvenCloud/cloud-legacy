import { config } from './config';

const { useTestClient } = require('./config');

function getTestClient() {
  const topicHandlers = new Map();
  return {
    publish(topic, message) {
      if (topicHandlers.has(topic)) {
        topicHandlers.get(topic).forEach(handler => handler(message));
      }
    },
    subscribe(topic, handler) {
      const handlers = topicHandlers.has(topic)
        ? topicHandlers.get(topic)
        : new Set();
      topicHandlers.set(topic, handlers);
      handlers.add(handler);
      return {
        remove() {
          handlers.delete(handler);
        },
      };
    },
  };
}

function getRedisClient() {
  return {
    async publish(topic, message) {
      // const publisher = pubsub.topic(topic).publisher();
      // const messageData = Buffer.from(JSON.stringify(message));
      // await publisher.publish(messageData);
      console.log(`${config.INSTANCE_ID} Published to ${topic}`, message);
    },
    async subscribe(topic, handler) {
      // const subscription = pubsub.subscription(`${topic}-subscription`);
      // const messageHandler = cloudMessage => {
      //   const message = JSON.parse(cloudMessage.data);
      //   console.log(
      //     `${config.INSTANCE_ID} Recieved message from ${topic}`,
      //     message,
      //   );
      //   handler(message);
      //   cloudMessage.ack();
      // };
      // subscription.on(`message`, messageHandler);
      console.log(`${config.INSTANCE_ID} subscribed to ${topic}`);
      return {
        remove() {
          // console.log(
          //   `${config.INSTANCE_ID} Removing subscription from ${topic}`,
          // );
          // subscription.removeListener('message', messageHandler);
          // console.log('Subscription removed from ' + topic);
        },
      };
    },
  };
}

const client = useTestClient ? getTestClient() : getRedisClient();

export function publish(topic, message) {
  return client.publish(topic, message);
}

export function subscribe(topic, handler) {
  return client.subscribe(topic, handler);
}
