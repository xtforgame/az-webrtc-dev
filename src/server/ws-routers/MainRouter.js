import RouterBase from '../core/router-base';

export default class MainRouter extends RouterBase {
  calls = {};
  setupRoutes({ router }) {
    router.send('/join', (ctx, next) =>
      // console.log('ctx.params.cmdType :', ctx.params.cmdType);
      ctx.body.json().then((json) => {
        console.log(json);
      })
    );

    router.post('/calls', (ctx, next) => ctx.body.json().then((data) => {
      console.log('/calls');
      let fromUser = ctx.rcPeer.getUser();
      let toUser = this.userSessionManager.findUser(data.to);
      console.log(`========= Call From ${fromUser.data.name} To ${toUser.data.name} =========`);
      console.log('data :', JSON.stringify(data));

      let uid = `${fromUser.uid}:${data.to}:${new Date().getTime()}`;
      let ns = uid;
      let call = {
        uid,
        caller: fromUser.uid,
        callerName: fromUser.data.name,
        callee: data.to,
        calleeName: toUser.data.name,
        ns,
        status: 'calling',
      };

      if(!fromUser.joinChannel(ns)){
        return ctx.body.json().then((json) => {
          return ctx.rcResponse.send({
            call: null,
          });
        })
      }

      this.calls[uid] = call;

      let result = {
        call,
        callId: uid,
        userId: fromUser.uid,
        userName: fromUser.data.name,
      };
      console.log('result :', JSON.stringify(result));

      toUser.send({
        path: `/calls/${uid}`,
        body: result,
      });
      
      return ctx.rcResponse.send(result);
    }));

    router.patch('/calls/:callId', (ctx, next) => ctx.body.json().then((data) => {
      let call = this.calls[ctx.params.callId];
      if(!call){
        return ctx.rcResponse.send({
          errorMsg: 'Wrong callId',
        });
      }
      let user = ctx.rcPeer.getUser();
      if(call.response){
        return ctx.rcResponse.send({
          errorMsg: `Response :${call.response} has been set`,
        });
      }

      if(data.response){
        console.log(`========= From ${user.data.name} : ${data.response} =========`);
        console.log('data :', JSON.stringify(data));
        if(user.uid === call.callee){
          let caller = this.userSessionManager.findUser(call.caller);
          call.response = data.response;
          if(data.response === 'accept'){
            user.joinChannel(call.ns);
          }else{
            caller.leaveChannel(call.ns);
          }

          let result = {
            call,
            callId: call.uid,
            userId: user.uid,
            userName: user.data.name,
          };
          console.log('result :', JSON.stringify(result));

          caller.send({
            path: `/calls/${call.uid}`,
            body: result,
          });
          return ctx.rcResponse.send(result);
        }else if(user.uid === call.caller && data.response === 'cancel'){
          let callee = this.userSessionManager.findUser(call.callee);
          call.response = data.response;
          user.leaveChannel(call.ns);

          let result = {
            call,
            callId: call.uid,
            userId: user.uid,
            userName: user.data.name,
          };
          console.log('result :', JSON.stringify(result));

          callee.send({
            path: `/calls/${call.uid}`,
            body: result,
          });
          return ctx.rcResponse.send(result);
        }
      }

      return ctx.rcResponse.send({
        errorMsg: 'Wrong argument',
      });
    }));

    router.send('/ice', (ctx, next) => {
      console.log('/ice');
      // console.log('ctx.params.cmdType :', ctx.params.cmdType);
      return ctx.body.json().then((json) => {
        // console.log(json.userId);
        // console.log(json.callId);
        return ctx.rcPeer.channelBroadcast(json.callId, {
          path: '/ice',
          body: json,
        });
      })
    });

    router.send('/sdp', (ctx, next) => {
      console.log('/sdp');
      // console.log('ctx.params.cmdType :', ctx.params.cmdType);
      return ctx.body.json().then((json) => {
        // console.log(json.userId);
        // console.log(json.callId);
        return ctx.rcPeer.channelBroadcast(json.callId, {
          path: '/sdp',
          body: json,
        });
      })
    });
  }
}
