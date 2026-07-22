import { ResourceNotFoundException } from './not-found.exception';

export class ProjectNotFoundException extends ResourceNotFoundException {
  constructor() {
    super('Projeto');
  }
}
