export class CancelToken {
  constructor(){
    this.canceled = false;
    this.cancelReason = null;
    this.cancelFunc = null;
  }

  setHandled(){
    this.canceled = true;
  }

  setCancelFunc(cancelFunc){
    this.cancelFunc = cancelFunc;
    if(this.canceled){
      this.cancelFunc(this.cancelReason);
    }
  }

  cancel(reason){
    if(this.canceled){
      return ;
    }
    this.cancelReason = reason;
    if(this.cancelFunc){
      this.cancelFunc(this.cancelReason);
    }
    this.setHandled();
  }
}

export default (promise, cancelToken) => {
  let handled = false;
  let needCancel = false;
  let cancelReason = null;
  let rejectFuc = null;

  const wrappedPromise = new Promise((resolve, reject) => {
    rejectFuc = reject;
    promise.then((val) => {
      if(handled) return ;
      handled = true;
      needCancel ? reject({cancelReason, isCanceled: true}) : resolve(val);
    })
    .catch((error) => {
      if(handled) return ;
      handled = true;
      needCancel ? reject({cancelReason, isCanceled: true}) : reject(error);
    });
  });

  const cancel = (reason) => {
    if(handled) return ;
    if(rejectFuc){
      rejectFuc({cancelReason: reason, isCanceled: true});
      handled = true;
    }else{
      cancelReason = reason;
      needCancel = true;
    }
    cancelToken && cancelToken.setHandled();
  }

  cancelToken && cancelToken.setCancelFunc(cancel);

  return {
    promise: wrappedPromise,
    cancel,
  };
};
