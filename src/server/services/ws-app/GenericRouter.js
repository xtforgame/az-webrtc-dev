import createRouter from 'generic-router';

const methods = ['connect', 'open', 'message', 'error', 'close', 'post', 'patch', 'delete', 'get', 'send'];

export default class GenericRouter extends createRouter({ methods }) {
  constructor(config = {}) {
    config.methods = methods.map(method => method.toUpperCase());
    super(config);
  }
}
