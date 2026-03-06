import { BadRequestException, Injectable, UseInterceptors } from "@nestjs/common";
import { UserRepository } from "@modules/users/user.repository";
import { UserNotExistsException } from "src/utils/errors/user_not_exists.exception";

@Injectable()
export class UserSevice {
  constructor(
    private readonly repository: UserRepository
  ) {}

  async addPhoto(username: string, url: string) {
    const result = await this.repository.edit(
      username,
      {
        photo: url
      }
    )

    return result;
  }
}