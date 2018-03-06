export default class WsApp {
  constructor(){
    this.middlewares = [];
  }

  use(middleware){
    this.middlewares.push(middleware);
  }

  _run(ctx, index = 0){
    if(index >= this.middlewares.length){
      return Promise.resolve(null);
    }
    return Promise.resolve()
    .then(() => {
      const next = () => {
        return this._run(ctx, index + 1);
      };
      return this.middlewares[index](ctx, next);
    });
  }

  callback = () => (ctx) => {
    return this._run(ctx);
  }
}
