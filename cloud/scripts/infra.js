const fetch = require('node-fetch');

const DO_KEY =
  '9532c1260359f304ffcc94b131b0390ac5744d92c515bb4311ce1d8449185513';

const doGet = async path => {
  const res = await fetch(`https://api.digitalocean.com/v2/${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DO_KEY}`,
    },
  });
  return await res.json();
};

const setup = async () => {
  const account = await doGet('account');
  const droplets = await doGet('droplets?page=1&per_page=100');
  console.log('account', droplets.droplets[0].networks);
  return account;
};

setup().then(() => {
  console.log('done!');
});
