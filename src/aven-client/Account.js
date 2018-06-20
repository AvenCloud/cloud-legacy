import Store from './Store';

export default class Account extends Store {
  constructor(a, authName) {
    super();
    this._a = a;
    this._authName = authName;
    // todo: look up authName from some cache if available
    this.state = {
      authName,
    };
  }
}
