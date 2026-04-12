// export enum Actions {
//   CREATE = 'create',
//   READ = 'read',
//   UPDATE = 'update',
//   DELETE = 'delete',
//   MANAGE = 'manage',
// }

export enum Actions {
  ALL = '*',
  CREATE = 'create',
  FIND = 'find',
  DEL = 'del',
  EDIT = 'edit',
  LIST = 'list',

  MANAGE = `manage`,

  PROMOTE = `promote`,
  DEMOTE = `demote`,
}