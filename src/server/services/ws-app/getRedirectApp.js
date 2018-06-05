import Koa from 'koa';
import { serverEnvName, httpPort } from '../../core/config';

let redirect = `<script>window.location = "http://" + window.location.hostname + ":${httpPort}";</script>`;
if (serverEnvName === 'linuxDocker') {
  // redirect = '<script>window.location = "https://" + window.location.hostname + ":8443";</script>';
  redirect = '<script>window.location = "https://" + window.location.hostname;</script>';
}

export default function getRedirectApp() {
  const wsApp = new Koa();
  wsApp.use((ctx) => {
    ctx.body = redirect;
  });

  return wsApp;
}
