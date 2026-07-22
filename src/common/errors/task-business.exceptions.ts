import { BusinessRuleException } from './business-rule.exception';
import { ConflictException } from './conflict.exception';

export class TaskCodeGenerationConflictException extends ConflictException {
  constructor() {
    super('Não foi possível gerar um código único para a tarefa.');
  }
}

export class TaskMemberProjectMismatchException extends BusinessRuleException {
  constructor() {
    super('A tarefa e o membro devem pertencer ao mesmo projeto.');
  }
}

export class TaskWorkLogOwnerMismatchException extends BusinessRuleException {
  constructor() {
    super('O membro do registro de trabalho deve ser o responsável pela tarefa.');
  }
}

export class TaskNotStartedException extends BusinessRuleException {
  constructor() {
    super(
      'A tarefa deve possuir started_at antes que seu tempo de trabalho possa ser registrado.',
    );
  }
}

export class NoPendingTaskWorkTimeException extends BusinessRuleException {
  constructor() {
    super('Não há tempo de trabalho da tarefa pendente de registro.');
  }
}
