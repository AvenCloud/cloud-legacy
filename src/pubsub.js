const PubSub = require(`@google-cloud/pubsub`);

const pubsub = new PubSub();

console.log('launching pubsub ' + process.env.GOOGLE_APPLICATION_CREDENTIALS);

export default pubsub;
