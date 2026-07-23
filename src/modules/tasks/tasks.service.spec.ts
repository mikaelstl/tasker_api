jest.mock('nanoid', () => ({
  customAlphabet: jest.fn(() => jest.fn(() => 'ABC123')),
}));

import { AccessDeniedException } from 'src/common/errors/access-denied.exception';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let repository: any;
  let audit: any;
  let service: TasksService;

  beforeEach(() => {
    repository = {
      findEditContext: jest.fn(),
      memberBelongsToProject: jest.fn(),
      edit: jest.fn(),
    };
    audit = {
      logUserMutation: jest.fn(),
    };
    service = new TasksService(repository, audit);
  });

  it('permite ao gestor atribuir um membro do mesmo projeto', async () => {
    repository.findEditContext.mockResolvedValue({
      id: 'task-1',
      stage: 'PENDING',
      ownerkey: null,
      owner: null,
      project: {
        org: { ownerkey: 'owner' },
        manager: { userkey: 'manager' },
      },
    });
    repository.memberBelongsToProject.mockResolvedValue(true);
    repository.edit.mockResolvedValue({
      id: 'task-1',
      stage: 'PENDING',
      ownerkey: 'member-1',
    });

    await expect(service.edit(
      'project-1',
      'TSK-1',
      { ownerkey: 'member-1' },
      { orgkey: 'org-1', actorkey: 'manager' },
    )).resolves.toMatchObject({ ownerkey: 'member-1' });
    expect(repository.memberBelongsToProject)
      .toHaveBeenCalledWith('member-1', 'project-1');
  });

  it('impede o responsável atual de transferir a própria tarefa', async () => {
    repository.findEditContext.mockResolvedValue({
      id: 'task-1',
      stage: 'PENDING',
      ownerkey: 'member-1',
      owner: {
        user: { userkey: 'member-user' },
      },
      project: {
        org: { ownerkey: 'owner' },
        manager: { userkey: 'manager' },
      },
    });

    await expect(service.edit(
      'project-1',
      'TSK-1',
      { ownerkey: 'member-2' },
      { orgkey: 'org-1', actorkey: 'member-user' },
    )).rejects.toBeInstanceOf(AccessDeniedException);
    expect(repository.edit).not.toHaveBeenCalled();
  });
});
