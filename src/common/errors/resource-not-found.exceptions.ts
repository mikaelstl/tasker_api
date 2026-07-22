import { ResourceNotFoundException } from './not-found.exception';

export class AccountNotFoundException extends ResourceNotFoundException {
  constructor() { super('Conta'); }
}

export class AffiliationNotFoundException extends ResourceNotFoundException {
  constructor() { super('Afiliação'); }
}

export class CommentNotFoundException extends ResourceNotFoundException {
  constructor() { super('Comentário'); }
}

export class EventNotFoundException extends ResourceNotFoundException {
  constructor() { super('Evento'); }
}

export class MemberNotFoundException extends ResourceNotFoundException {
  constructor() { super('Membro'); }
}

export class StatsReportNotFoundException extends ResourceNotFoundException {
  constructor() { super('Relatório de estatísticas'); }
}

export class StatsSnapshotNotFoundException extends ResourceNotFoundException {
  constructor() { super('Snapshot de estatísticas'); }
}

export class TaskNotFoundException extends ResourceNotFoundException {
  constructor() { super('Tarefa'); }
}

export class UserOrganizationAffiliationNotFoundException extends ResourceNotFoundException {
  constructor() {
    super(
      'Afiliação do usuário na organização',
      'Este membro não pertence à organização.',
    );
  }
}
