declare module 'ws' {
  export default interface Websocket {
    send(...args : any[]) : any;
    emit(eventName : string, ...args : any[]) : any;
    on(eventName : string, cb : Function) : any;
    close(code? : number, reason? : string) : any;
  }

  export interface IServer {
    send(...args : any[]) : any;
    emit(eventName : string, ...args : any[]) : any;
    on(eventName : string, cb : Function) : any;
    close(code? : number, reason? : string) : any;
  }

  export var Server : {
    new (...args : any[]) : IServer;
    emit(event: string, ...args: any[]): boolean;
  }
}

declare module 'config';
declare module 'common/config';
