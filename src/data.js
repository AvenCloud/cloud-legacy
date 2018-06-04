const { useTestClient, config } = require('./config');

const stream = require('stream');
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
      return await fs.outputFile(path.join(testDir, name), buffer);
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
      const data = await m.getObject(bucket, name);
      return await getRawBody(data);
    },
    async putFile(name, buffer) {
      const data = new stream.Writable();
      data.end(buffer);
      await m.putObject(bucket, name, data);
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
  return JSON.parse(data);
}

export async function putObject(id, data) {
  if (data === undefined) {
    return await client.destroyFile(id);
  }
  const fileData = JSON.stringify(data);
  await client.putFile(id, fileData);
}

const dataIDforAccount = (domain, accountID) =>
  `domain/${domain}/accounts/${accountID}`;

export async function getAccount(domain, accountID) {
  return getObject(dataIDforAccount(domain, accountID));
}

export async function putAccount(domain, accountID, account) {
  return putObject(dataIDforAccount(domain, accountID), account);
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

const dataIDforDoc = (domain, owner, docID) =>
  `domain/${domain}/doc/${owner}/${docID}`;

export async function getDoc(domain, owner, docID) {
  return getObject(dataIDforDoc(domain, owner, docID));
}

export async function putDoc(domain, owner, docID, docData) {
  return putObject(dataIDforDoc(domain, owner, docID), docData);
}

const dataIDforDocMeta = (domain, owner, docID) =>
  `domain/${domain}/doc-meta/${owner}/${docID}`;

export async function getDocMeta(domain, owner, docID) {
  return getObject(dataIDforDocMeta(domain, owner, docID));
}

export async function putDocMeta(domain, owner, docID, docData) {
  return putObject(dataIDforDocMeta(domain, owner, docID), docData);
}
