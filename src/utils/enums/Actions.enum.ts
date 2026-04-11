enum BaseActions {
  ADD    = 'add',
  DEL    = 'del',
  VIEW   = 'view',
  LIST   = 'list',
  FIND   = 'find',
  EDIT   = 'edit',
  DEFINE = 'define',
}

enum NestedActions {
  OWNER = 'owner',
  TO_ME = 'to_me',
  TO_OTHER = 'to_other'
}

type ActionType = BaseActions | NestedActions;

export {
  BaseActions,
  NestedActions,
  ActionType
}