export interface Repository {
  create(data: any): Promise<any>;
  list(query?: any): Promise<any>;
  find(queries: {[ key:string ]: string}): Promise<any>;
  edit(id: string, update: any): Promise<any>;
  delete(id: string): Promise<any>;
}