import { Injectable } from '@nestjs/common';
import { UserRepository } from "@modules/users/user.repository";

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
