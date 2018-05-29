require('./config');

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

function getGCSClient() {
  const PubSub = require(`@google-cloud/pubsub`);
  const pubsub = new PubSub();
  console.log(
    'Starting google cloud pubsub ' +
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );

  // DO NOT FORGET TO CREATE THE TOPIC + SUBSCRIPTION!
  // // gcloud pubsub topics create my-topic
  // // gcloud pubsub subscriptions create my-topic-subscription --topic my-topic

  return {
    publish(topic, message) {
      const { publish } = pubsub.topic('session-destroy').publisher();
      const messageData = Buffer.from(JSON.stringify(message));
      publish(messageData);
      console.log('Published to ' + topic, message);
    },
    subscribe(topic, handler) {
      const subscription = pubsub.subscription(`${topic}-subscription`);
      const messageHandler = cloudMessage => {
        const message = JSON.parse(cloudMessage.data);
        console.log('Message from ' + topic, message);
        handler(message);
        cloudMessage.ack();
      };
      subscription.on(`message`, messageHandler);
      console.log('Subscribed to ' + topic);
      return {
        remove() {
          subscription.removeListener('message', messageHandler);
          console.log('Subscription removed from ' + topic);
        },
      };
    },
  };
}

const client = useTestClient ? getTestClient() : getGCSClient();

export function publish(topic, message) {
  return client.publish(topic, message);
}

export function subscribe(topic, handler) {
  return client.subscribe(topic, handler);
}
