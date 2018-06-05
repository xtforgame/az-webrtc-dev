/* eslint-disable no-console */
export default class InstManager {
  constructor(gusm, userId) {
    this.gusm = gusm;
    this.userId = userId;
  }

  stopUpdate() {
    clearInterval(this.timer);
  }

  startUpdate() {
    this.stopUpdate();
    this.timer = setInterval(this.sendToClient, 2000);
  }

  sendToClient = () => {
    const user = this.gusm.findUser(this.userId);
    if (user) {
      try {
        user.send({
          path: '/bot-status',
          body: {
            bot: {},
          },
        });
      } catch (e) {
        console.log('e :', e);
      }

    }
  }
}
