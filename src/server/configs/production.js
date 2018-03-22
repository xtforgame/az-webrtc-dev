import path from 'path';

const credentialFiles = {
  basePath: path.join(__dirname, '..', 'ssl/production/dimension8ai.com'),
  key: 'key.pem',
  cert: 'fullchain.pem',
  ca: 'chain.pem',
};

let httpPort = 10034;
let httpsPort = 10035;

export {
  credentialFiles,
  httpPort,
  httpsPort,
};
