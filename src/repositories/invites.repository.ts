import { AlreadyExistsException } from "@exceptions/user_exists.error";
import { Invite } from "@models/invite.model";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ApiResponse } from "@interfaces/response";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { Repository } from "@interfaces/Repository";

export type SendInvitesDTO = {
  receiver: string;
  sender: string;
}

@Injectable()
export class InvitesRepository {
  constructor(
    @InjectModel(Invite) private readonly Invites: typeof Invite
  ) {}

  async inviteAlreadyExists (sender: string, receiver: string) {
    try {
      const exists = await this.Invites.findOne({
        where: {
          [ Op.and ]: [
            { sender: sender },
            { receiver: receiver }
          ]
        }
      })
      
      if (exists) {
        throw new AlreadyExistsException('INVITE ALREADY EXISTS');
      }
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async create(data: SendInvitesDTO) {
    await this.inviteAlreadyExists(data.sender, data.receiver);
    try {
      const result = await this.Invites.create(
        {
          sender: data.sender,
          receiver: data.receiver
        }
      );

      return result;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async list(key: string) {
    try {
      const response = await this.Invites.findAll(
        {
          where: {
            [ Op.and ]: [
              { pending: true },
              {
                [ Op.or ]: [
                  { sender: key },
                  { receiver: key }
                ]
              }
            ]
          }
        }
      )
      
      if (!response || response.length === 0) {
        return 'WITHOUT RELATION REQUESTS';
      }

      return response;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }
  
  async edit(id: string, data: any) {
    try {
      const response = await this.Invites.update(
        data,
        {
          where: {
            id: id
          },
          returning: true
        },
      );
      
      return {
        data: response,
        error: false,
        message: "CHANGED"
      } as ApiResponse;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async delete(id: string) {
    try {
      const response = await this.Invites.destroy({
        where: {
          id: id
        }
      });
    
      if (!response) {
        throw new NotFoundException();
      }

      return {
        data: response,
        error: false,
        message: 'REMOVED'
      } as ApiResponse;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }
}