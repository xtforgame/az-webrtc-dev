declare module 'generic-router' {
  export interface IRouterOptions {
    methods?: string[];
  }

  export interface IRouter {
    routes() : Function;
  }

  export interface IRouterClass {
    new (config : any) : IRouter;
  }

  export default function (options : IRouterOptions) : IRouterClass;
}

declare module 'config';
