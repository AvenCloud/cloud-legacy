const fetch = require('node-fetch');

const client = ({ host, disableHTTPS }) => {
  return {
    async dispatch(action) {
      const httpMethod = disableHTTPS ? 'http' : 'https';
      // const wsMethod = disableHTTPS ? 'ws' : 'wss';
      const dispatchURI = `${httpMethod}://${host}/api`;
      const res = await fetch(dispatchURI, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      });
      return await res.json();
    },
  };
};

module.exports = client;
