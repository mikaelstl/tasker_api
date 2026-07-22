import { UserNotFoundException } from './user-not-found.exception';

export { UserNotFoundException } from './user-not-found.exception';

/** @deprecated Use UserNotFoundException. */
export class UserNotExistsException extends UserNotFoundException {}
