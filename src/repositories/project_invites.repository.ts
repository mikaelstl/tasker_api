import { AlreadyExistsException } from "@exceptions/user_exists.error";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ApiResponse } from "@interfaces/response";
import { PrismaService } from "src/database/prisma.service";

export interface SendInvitesDTO {
  readonly receiver: string;
  readonly sender: string;
  readonly project: string;
}

@Injectable()
export class ProjectInvitesRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async inviteAlreadyExists(sender: string, receiver: string) {
    try {
      const exists = await this.prisma.projectInvite.findFirst({
        where: {
          AND: [
            { senderkey: sender },
            { receiverkey: receiver }
          ]
        }
      })

      if (exists) {
        throw new AlreadyExistsException('Invite already exists');
      }
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async create(data: SendInvitesDTO) {
    await this.inviteAlreadyExists(data.sender, data.receiver);
    try {
      const result = await this.prisma.projectInvite.create({
        data: {
          senderkey: data.sender,
          receiverkey: data.receiver,
          projectkey: data.project
        }
      });

      return result;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async list(key: string) {
    try {
      const response = await this.prisma.projectInvite.findMany({
        where: {
          AND: [
            { pending: true },
            {
              OR: [
                { senderkey: key },
                { receiverkey: key }
              ]
            }
          ]
        }
      });

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
      const response = await this.prisma.projectInvite.update({
        data,
        where: {
          id: id
        }
      });

      return response;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async delete(id: string) {
    try {
      const response = await this.prisma.projectInvite.delete({
        where: {
          id: id
        }
      });

      if (!response) {
        throw new NotFoundException();
      }

      return response;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }
}