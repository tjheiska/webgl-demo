/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

interface JQuery {
	modal(options?: any):JQuery;
}