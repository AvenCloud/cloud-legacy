const crypto = require('crypto');
const fs = require('fs');

export function checksumFile(filename) {
  return new Promise((resolve, reject) => {
    const sum = crypto.createHash('sha1');
    const fileStream = fs.createReadStream(filename);
    fileStream.on('error', err => {
      reject(err);
    });
    fileStream.on('data', chunk => {
      try {
        sum.update(chunk);
      } catch (ex) {
        reject(ex);
      }
    });
    fileStream.on('end', () => {
      resolve(sum.digest('hex'));
    });
  });
}
