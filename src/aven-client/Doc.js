import Store from './Store';

export default class Doc extends Store {
  constructor(a, docName) {
    super();
    this._a = a;
    this._docName = docName;
    // todo: look up doc from some cache if available
    this.state = {
      docName,
    };
  }
}
