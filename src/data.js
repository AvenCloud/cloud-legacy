const { useTestClient } = require('./config');

const path = require('path');

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
    endPoint: process.env.STORAGE_HOST,
    secure: !!process.env.STORAGE_SECURE,
    accessKey: process.env.STORAGE_ACCESS,
    secretKey: process.env.STORAGE_KEY,
  });

  const bucket = process.env.STORAGE_BUCKET;

  return {
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
