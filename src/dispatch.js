const path = require('path');
const fs = require('fs');
const { validate } = require('jsonschema');

const actions = {
  CreateUser: require('./actions/CreateUser'),
};

export default async function dispatch(action) {
  if (actions[action.type]) {
    const a = actions[action.type];
    const validationResult = validate(action, a.schema);
    if (!validationResult.valid) {
      throw validationResult;
    }
    return await a.default(action);
  }
  throw `Action type "${action.type}" not found`;
}
