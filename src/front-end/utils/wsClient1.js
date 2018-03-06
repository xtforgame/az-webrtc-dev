import wsProtocol from '~/utils/wsProtocol1';

const onSend = ({ rawData, wsMsg, data }) => {
  const action = data.payload;
  const { type, payload } = action;

  if (payload.error) {
    // anything?
  }
  const result = ActionTable.S2C[type].handler(payload);
  if (Array.isArray(result)) {
    result.forEach((a) => { emit(a); });
  } else {
    emit(result);
  }
};

const onDisconnect = (data) => {
};

wsProtocol.events.addListener('send', onSend);
wsProtocol.events.addListener('disconnect', onDisconnect);

export const cancel = (
  () => {
    wsProtocol.events.removeListener('send', onSend);
    wsProtocol.events.removeListener('disconnect', onDisconnect);
  }
);

export function sendTest(body) {
  return wsProtocol.open()
    .then(() => wsProtocol.send({
      path: '/test-api',
      body,
    }));
}

export function requestTest(body) {
  return wsProtocol.open()
    .then(() => wsProtocol.request({
      method: 'POST',
      path: '/test-api',
      body,
    }));
}
