require('./config');

const path = require('path');

const Minio = require('minio');

const m = new Minio.Client({
  endPoint: process.env.STORAGE_HOST,
  secure: !!process.env.STORAGE_SECURE,
  accessKey: process.env.STORAGE_ACCESS,
  secretKey: process.env.STORAGE_KEY,
});

const bucket = process.env.STORAGE_BUCKET;

export async function list() {
  const objectStream = m.listObjects(bucket);
  const files = [];
  objectStream.on('data', obj => {
    files.push(obj);
  });
  return new Promise((resolve, reject) => {
    objectStream.on('error', err => {
      reject(err);
    });
    objectStream.on('end', err => {
      resolve(files);
    });
  });
}
