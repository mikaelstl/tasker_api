import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CreateUserDTO } from "src/DTO/user/create.dto";
import { UserDTO } from "src/DTO/user/user.dto";
import { UserRepository } from "@modules/users/user.repository";
import { AuthService } from "src/security/auth.service";
import { JwtAuthGuard } from "src/services/auth/auth.guard";

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  @Get()
  async list() {
    return await this.userRepository.list();
  }

  @Get(':username')
  async find(
    @Param('username') username: string
  ) {
    console.log(username);
    
    return await this.userRepository.find(username);
  }

  // @Post('/invite')
  // async send(
  //   @Body() data: any
  // ){
  //   return await this.relationService.send(data);
  // }

  // @Get('/invite/:username')
  // async listRequests(
  //   @Param('username') username: string
  // ){
  //   return await this.relationService.list(username);
  // }

  // @Put('/invite/:id/accept')
  // async accept(
  //   @Param('id') invite_id: string
  // ){
  //   return await this.relationService.accept(invite_id);
  // }

  // @Delete('/invite/del/:id')
  // async deleteInvite(
  //   @Param('id') id: string
  // ) {
  //   return await this.relationService.del(id);
  // }

  // @Delete()
  // async delete(
  //   @Body() value: { username: string }
  // ) {
  //   await this.repository.delete(value.username);
  // }
}