const actions = {
  AuthRequest: require('./actions/AuthRequest'),
  AccountCreate: require('./actions/AccountCreate'),
  AccountGet: require('./actions/AccountGet'),
  AccountPut: require('./actions/AccountPut'),
  SessionCreate: require('./actions/SessionCreate'),
  SessionDestroy: require('./actions/SessionDestroy'),
  DocGet: require('./actions/DocGet'),
  DocPut: require('./actions/DocPut'),
};

export default async function dispatch(action) {
  const a = actions[action.type];
  if (!a) {
    throw new Error({
      message: `Action type "${action.type}" not found`,
      path: 'type',
    });
  }
  const validAction = await a.schema.strict().validate(action);
  return await a.default(validAction);
}
