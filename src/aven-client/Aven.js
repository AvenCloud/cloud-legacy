import { Container } from 'unstated';
import Doc from './Doc';
import Account from './Account';
const fetch = require('node-fetch');

export default class Aven extends Container {
  constructor({ host, disableHTTPS, onCookieData, cookieData, domain }) {
    super();
    this._onCookieData = onCookieData;
    this.state = {
      host,
      disableHTTPS,
      domain,
      isAuthenticated: false,
      authSession: null,
      authKey: null,
      authName: null,
      authRequestMethod: null,
      authRequestInfo: null,
      authRequestChallenge: null,
      ...cookieData,
    };
  }

  async setState(newState) {
    await super.setState(newState);
    this._onCookieData && this._onCookieData(this.state);
  }

  async dispatchWithSession(action) {
    const { authName, authSession, authKey } = this.state;
    if (!authName) {
      throw new Error(
        'Cannot dispatchWithSession because stored authName is empty',
      );
    }
    if (!authSession) {
      throw new Error(
        'Cannot dispatchWithSession because stored authSession is empty',
      );
    }
    if (!authKey) {
      throw new Error(
        'Cannot dispatchWithSession because stored authKey is empty',
      );
    }
    return this.dispatchWithDomain({
      ...action,
      authSession,
      authKey,
      authName,
    });
  }

  async dispatchWithDomain(action) {
    const { domain } = this.state;
    return this.dispatch({
      ...action,
      domain: domain ? domain : undefined,
    });
  }

  async dispatch(action) {
    const { disableHTTPS, host } = this.state;
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
    console.log('response! ', action, res.status);
    return await res.json();
  }

  _docs = {};
  _accounts = {};

  doc(docName) {
    if (this._docs[docName]) {
      return this._docs[docName];
    }
    return (this._docs[docName] = new Doc(this, docName));
  }

  account(authName) {
    if (this._accounts[authName]) {
      return this._accounts[authName];
    }
    return (this._accounts[authName] = new Account(this, authName));
  }

  myAccount() {
    if (this.state.authName) {
      return this.account(this.state.authName);
    }
    return null;
  }

  async login(authName) {
    this.setState({
      isAuthenticated: true,
    });
  }

  async loginWithPassword(authName, password) {}

  async authRequest(authMethod, authInfo) {
    const requestData = await this.dispatch({
      type: 'authRequest',
      authMethod,
      authInfo,
    });
    await this.setState({
      authRequestMethod: authMethod,
      authRequestInfo: authInfo,
    });
    if (!requestData || !requestData.authChallenge) {
      throw new Error('Auth request not completed');
    }
    await this.setState({
      authRequestChallenge: requestData.authChallenge,
    });
  }

  async accountCreate({ authName, authResponse }) {
    const accountCreateResponse = await this.dispatchWithDomain({
      type: 'accountCreate',
      authName,
      authMethod: this.state.authRequestMethod,
      authInfo: this.state.authRequestInfo,
      authResponse,
    });
    await this.setState({
      authRequestMethod: null,
      authRequestInfo: null,
      isAuthenticated: true,
      authKey: accountCreateResponse.authKey,
      authSession: accountCreateResponse.authSession,
      authName: accountCreateResponse.authName,
    });
    debugger;
  }

  async sessionDestroy() {
    if (!this.state.authSession) {
      return;
    }
    const { authName } = this.state;
    this.setState({
      // Always destroy this key!
      authKey: null,
      isAuthenticated: false,
      authName: null,
    });
    // todo: flush local data

    // This query can be retried if the network fails, but the local session unusable without the key which we threw away
    await this.dispatchWithDomain({
      type: 'sessionDestroy',
      authName,
      authSession: this.state.authSession,
    });
    await this.setState({
      authSession: null,
    });
  }
}
