import { uuid, hashSecureString, genKey, checksum } from '../src/utils';
import {
  PERMISSION,
  getRefPermissionForRuleName,
  addPermissions,
} from '../src/permission';

const ADMIN_USERS = new Set(process.env.ADMIN_USERS.split(','));

export const startService = ({ db, name, authMethods }) => {
  name = name || `auth-${uuid()}`;

  async function verifyAuthentication({
    domain,
    authName,
    authMethod,
    authInfo,
    authResponse,
  }) {
    const AuthMethod = authMethods[authMethod];
    if (!AuthMethod) {
      throw new Error('Invalid authMethod');
    }
    const authRef = AuthMethod.getAuthRef({ ...authInfo, authName });
    const authObjectRef = await db.actions.getRefObject({
      domain,
      ref: authRef,
    });
    const authData = (authObjectRef ? authObjectRef.object : null) || {};
    const verifiedAuthData = await AuthMethod.verify(authData, authResponse);
    await db.actions.putRefObject({
      domain,
      ref: authRef,
      object: verifiedAuthData,
    });
  }

  async function verifySession({ domain, authName, authKey, authSession }) {
    const ref = await db.actions.getRefObject({
      domain,
      ref: `~${authName}`,
    });
    if (
      !ref ||
      !ref.object ||
      !ref.object.sessions ||
      !ref.object.sessions[authSession] ||
      ref.object.sessions[authSession].authKeyChecksum !== checksum(authKey)
    ) {
      throw new Error(
        'Invalid Session Authentication. Check domain, authName, authKey, authSession ',
      );
    }
  }

  async function getRefPermission({
    domain,
    authName,
    authSession,
    authKey,
    ref,
  }) {
    const refResult = await db.actions.getRef({ domain, ref });

    const isPublic = !!refResult && refResult.isPublic;
    try {
      await verifySession({ domain, authName, authKey, authSession });
    } catch (e) {
      return isPublic ? PERMISSION.READ : PERMISSION.NONE;
    }
    if (ADMIN_USERS.has(authName)) {
      return PERMISSION.ADMIN;
    }
    if (`~${authName}` === ref) {
      return PERMISSION.ADMIN;
    }
    if (!refResult) {
      return isPublic ? PERMISSION.READ : PERMISSION.NONE;
    }
    console.log('yaaarrr');
  }

  const actions = {
    verifySession,
    getRefPermission,

    getRefObject: async ({ domain, authName, authSession, authKey, ref }) => {
      const permission = await getRefPermission({
        domain,
        authName,
        authSession,
        authKey,
        ref,
      });
      if (!permission.canRead) {
        return null;
      }
      return await db.actions.getRefObject({
        domain,
        ref,
      });
    },

    getObject: async ({ domain, authName, authSession, authKey, ref, id }) => {
      const permission = await getRefPermission({
        domain,
        authName,
        authSession,
        authKey,
        ref,
      });
      if (!permission.canRead) {
        return null;
      }
      return await db.actions.getObjectViaRef({
        domain,
        ref,
        id,
      });
    },

    putRefObject: async ({
      domain,
      authName,
      authSession,
      authKey,
      ref,
      object,
      lastId,
    }) => {
      const permission = await getRefPermission({
        domain,
        authName,
        authSession,
        authKey,
        ref,
      });
      if (!permission.canWrite) {
        throw new Error('Invalid permission');
      }
      return await db.actions.putRefObject({
        domain,
        ref,
        object,
        defaultOwner: `~${authName}`,
      });
    },

    putRefPermission: async ({
      domain,
      authName,
      authSession,
      authKey,
      ref,
      owner,
      permission,
    }) => {
      const actorPermission = await getRefPermission({
        domain,
        authName,
        authSession,
        authKey,
        ref,
      });
      if (!actorPermission.canAdmin) {
        throw new Error('Invalid permission');
      }
      await db.actions.putRefPermission({
        domain,
        ref,
        owner: `~${owner}`,
        permission,
      });
    },

    getRefPermissions: async ({
      domain,
      authName,
      authSession,
      authKey,
      ref,
    }) => {
      const actorPermission = await getRefPermission({
        domain,
        authName,
        authSession,
        authKey,
        ref,
      });
      if (!actorPermission.canAdmin) {
        throw new Error('Invalid permission');
      }
      return db.actions.getRefPermissions({ domain, ref });
    },

    destroyRefObject: async ({
      domain,
      authName,
      authSession,
      authKey,
      ref,
      id,
    }) => {},

    clearRef: async ({ domain, authName, authSession, authKey, ref }) => {
      const permission = await getRefPermission({
        domain,
        authName,
        authKey,
        authSession,
        ref,
      });
      if (!permission.canForce) {
        throw new Error('Insufficient permission');
      }
      await db.actions.destroyRefObjects({ domain, ref });
      await db.actions.setRefActiveObject({ domain, ref, id: null });
    },

    listRefObjects: async ({ domain, authName, authSession, authKey, ref }) => {
      const permission = await getRefPermission({
        domain,
        authName,
        authKey,
        authSession,
        ref,
      });
      if (!permission.canForce) {
        throw new Error('Insufficient permission');
      }
      return await db.actions.listRefObjects({ domain, ref });
    },

    setRefIsPublic: async ({
      domain,
      authName,
      authSession,
      authKey,
      ref,
      isPublic,
    }) => {
      const permission = await getRefPermission({
        domain,
        authName,
        authKey,
        authSession,
        ref,
      });
      if (!permission.canAdmin) {
        throw new Error('Insufficient permission');
      }
      await db.actions.setRefIsPublic({ domain, ref, isPublic });
      return { domain, ref, isPublic };
    },

    authRequest: async ({ domain, authMethod, authInfo }) => {
      // if (authMethod === 'Password') {
      //   return { authChallenge: null };
      // }
      const AuthMethod = authMethods[authMethod];
      if (!AuthMethod) {
        throw new Error('Invalid authMethod');
      }
      const authRef = AuthMethod.getAuthRef(authInfo);
      const authObjectRef = await db.actions.getRefObject({
        domain,
        ref: authRef,
      });
      const authData = (authObjectRef ? authObjectRef.object : null) || {};
      // // should probably implement rate limiting for repeated reset attempts of the same authRef
      const newAuthData = await AuthMethod.request(authRef, authInfo, authData);
      await db.actions.putRefObject({
        domain,
        ref: authRef,
        object: newAuthData,
      });
      const { authChallenge } = newAuthData;
      return { authChallenge };
    },

    accountPutAuth: async ({ foo, bar }) => {},

    accountCreate: async ({
      domain,
      authName,
      authMethod,
      authInfo,
      authResponse,
      password,
    }) => {
      const AuthMethod = authMethods[authMethod];
      if (!AuthMethod) {
        throw new Error('Invalid authMethod');
      }
      const authRef = AuthMethod.getAuthRef(authInfo);
      const authObjectRef = await db.actions.getRefObject({
        domain,
        ref: authRef,
      });
      const authData = (authObjectRef ? authObjectRef.object : null) || {};
      const verifiedAuthData = await AuthMethod.verify(authData, authResponse);

      if (authData.authName && authData.authName !== authName) {
        throw new Error(
          'An account already exists with this authentication info. Try logging in instead.',
        );
      }
      const accountRefName = `~${authName}`;
      const accountRef = await db.actions.getRefObject({
        domain,
        ref: accountRefName,
      });
      if (accountRef) {
        throw new Error('An account already exists with this name.');
      }

      const passwordHash = password ? await hashSecureString(password) : null;

      const sessions = {};
      const authSession = uuid();
      const authKey = await genKey();
      const authKeyChecksum = checksum(authKey);

      sessions[authSession] = {
        authKeyChecksum,
        sessionCreateTime: Date.now(),
        authRef,
        name: 'account_create',
      };

      const account = {
        primaryAuth: authRef,
        authName,
        domain,
        accountCreateTime: Date.now(),
        passwordHash,
        sessions,
        authRefs: [],
      };

      await db.actions.putRefObject({
        domain,
        ref: authRef,
        object: {
          ...verifiedAuthData,
          authName,
        },
      });

      await db.actions.putRefObject({
        domain,
        ref: accountRefName,
        owner: authRef,
        object: account,
      });

      return { authRef, authName, authSession, authKey, domain };
    },

    sessionDestroy: async ({ authName, domain, authSession }) => {
      const accountRefName = `~${authName}`;
      const account = await db.actions.getRefObject({
        ref: accountRefName,
        domain,
      });
      if (
        account &&
        account.object &&
        account.object.sessions &&
        account.object.sessions[authSession]
      ) {
        const sessions = { ...account.object.sessions };
        delete sessions[authSession];
        const newAccount = {
          ...account.object,
          sessions,
        };
        await db.actions.putRefObject({
          ref: accountRefName,
          domain,
          object: newAccount,
        });
      }
    },

    sessionCreate: async ({
      authName,
      domain,
      authMethod,
      authInfo,
      authResponse,
    }) => {
      await verifyAuthentication({
        domain,
        authName,
        authMethod,
        authInfo,
        authResponse,
      });
      const accountRefName = `~${authName}`;
      const AuthMethod = authMethods[authMethod];
      if (!AuthMethod) {
        throw new Error('Invalid authMethod');
      }
      const account = await db.actions.getRefObject({
        ref: accountRefName,
        domain,
      });
      if (!account || !account.object) {
        throw 'Invalid Authentication';
      }
      const authRef = AuthMethod.getAuthRef(authInfo);
      const authSession = uuid();
      const authKey = await genKey();
      const authKeyChecksum = checksum(authKey);

      const newAccount = {
        ...account.object,
        sessions: {
          ...account.object.sessions,
          [authSession]: {
            authKeyChecksum,
            sessionCreateTime: Date.now(),
            authRef,
            name: `login-${Date.now}`,
          },
        },
      };
      await db.actions.putRefObject({
        ref: accountRefName,
        domain,
        object: newAccount,
      });

      return { authRef, authName, authSession, authKey, domain };
    },
    // AuthRequest: require('./actions/AuthRequest'),
    // AccountCreate: require('./actions/AccountCreate'),
    // AccountGet: require('./actions/AccountGet'),
    // AccountPut: require('./actions/AccountPut'),
    // SessionCreate: require('./actions/SessionCreate'),
    // SessionDestroy: require('./actions/SessionDestroy'),
    // DocGet: require('./actions/DocGet'),
    // DocPut: require('./actions/DocPut'),
  };

  return { actions, remove: () => {}, name };
};
