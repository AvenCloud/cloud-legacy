import { useTestClient, config } from './config';
import { checksumFile } from './fsUtils';
// import { publish, subscribe } from './pubsub';

const Readable = require('stream').Readable;
const path = require('path');
const getRawBody = require('raw-body');

function getTestClient() {
  const fs = require('fs-extra');
  const testDir = './test-data';
  return {
    list() {},
    async getFile(name) {
      try {
        return await fs.readFile(path.join(testDir, name), {
          encoding: 'utf8',
        });
      } catch (e) {
        if (e.code === 'ENOENT') {
          return 'null';
        }
      }
    },
    async putFile(name, buffer) {
      const outPath = path.join(testDir, name);
      await fs.outputFile(outPath, buffer);

      const etag = await checksumFile(outPath);
      return etag;
    },
    async copyFile(from, to) {
      const fromPath = path.join(testDir, from);
      const toPath = path.join(testDir, to);
      await fs.copy(fromPath, toPath);
      const etag = await checksumFile(toPath);
      return etag;
    },
    async destroyFile(name) {
      return await fs.remove(path.join(testDir, name));
    },
  };
}

function getMinioClient() {
  const Minio = require('minio');

  const m = new Minio.Client({
    endPoint: config.STORAGE_HOST,
    secure: !!config.STORAGE_SECURE,
    accessKey: config.STORAGE_ACCESS,
    secretKey: config.STORAGE_KEY,
  });

  const bucket = config.STORAGE_BUCKET;

  return {
    async getFile(name) {
      try {
        const data = await m.getObject(bucket, name);
        return await getRawBody(data);
      } catch (e) {
        return null;
      }
    },
    async putFile(name, buffer) {
      var s = new Readable();
      s.push(buffer);
      s.push(null);
      const eTag = await m.putObject(bucket, name, s);
      console.log('put file with eTag!', eTag);
      return eTag;
    },
    async copyFile(from, to) {
      const result = await m.copyObject(bucket, to, from);
      if (result && result.etag) {
        return result.etag;
      }
      throw new Error('Invalid etag returned from data store!');
    },

    async destroyFile(name) {
      await m.removeObject(bucket, name);
    },

    list() {
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
    },
  };
}

const client = useTestClient ? getTestClient() : getMinioClient();

export async function getObject(id) {
  const data = await client.getFile(id);
  const obj = JSON.parse(data);
  if (typeof obj !== 'object') {
    throw new Error(`Invalid data in database for ${id}. Expected an object`);
  }
  return obj;
}

export async function copyObject(from, to) {
  return await client.copyFile(from, to);
}

export async function putObject(id, data) {
  if (data === undefined) {
    return await client.destroyFile(id);
  }
  const fileData = JSON.stringify(data);
  return await client.putFile(id, fileData);
}

const dataIDforAccount = (domain, authName) =>
  `domain/${domain}/accounts/${authName}`;

export async function getAccount(domain, authName) {
  return getObject(dataIDforAccount(domain, authName));
}

export async function putAccount(domain, authName, account) {
  return putObject(dataIDforAccount(domain, authName), account);
}

const dataIDforAuthMethod = (domain, authMethodID) =>
  `domain/${domain}/auth/${authMethodID}`;

export async function getAuth(domain, authMethodID) {
  return getObject(dataIDforAuthMethod(domain, authMethodID));
}

export async function putAuth(domain, authMethodID, authData) {
  return putObject(dataIDforAuthMethod(domain, authMethodID), authData);
}

const dataIDforSession = (domain, sessionID) =>
  `domain/${domain}/session/${sessionID}`;

export async function getSession(domain, sessionID) {
  return getObject(dataIDforSession(domain, sessionID));
}

export async function putSession(domain, sessionID, sessionData) {
  return putObject(dataIDforSession(domain, sessionID), sessionData);
}

const dataIDforDocName = (domain, owner, docName) =>
  `domain/${domain}/doc/${owner}/${docName}`;

const dataIDforDoc = (domain, etag) => `domain/${domain}/data/name/${etag}`;

export async function getDoc(domain, owner, docName) {
  return getObject(dataIDforDocName(domain, owner, docName));
}

export async function getDocVersion(domain, etag) {
  const data = await getObject(dataIDforDoc(domain, etag));
  return data;
}

export async function putDoc(domain, owner, docName, docData) {
  const mainDocDataID = dataIDforDocName(domain, owner, docName);
  const etag = await putObject(mainDocDataID, docData);
  const docDataID = dataIDforDoc(domain, etag);
  await copyObject(mainDocDataID, docDataID);
  return etag;
}

const dataIDforDocMeta = (domain, owner, docName) =>
  `domain/${domain}/doc-meta/${owner}/${docName}`;

export async function getDocMeta(domain, owner, docName) {
  return getObject(dataIDforDocMeta(domain, owner, docName));
}

export async function putDocMeta(domain, owner, docName, docData) {
  return putObject(dataIDforDocMeta(domain, owner, docName), docData);
}
