import { AlreadyExistsException } from "@exceptions/user_exists.error";
import { UserNotExistsException } from "@exceptions/user_not_exists.exception";
import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import { OrganizationCreateDTO } from "src/DTO/organization/create.dto";
import { OrganizationDTO } from "src/DTO/organization/organization.dto";

type OrgFindQuerie = {
  id?: string,
  name?: string
}

@Injectable()
export class OrganizationRepository {
  private logger: Logger = new Logger('OrganizationRepository');

  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(data: OrganizationCreateDTO): Promise<OrganizationDTO> {
    // await this.organizationExists(data.email);
    console.log(data);
    
    try {
      const result = await this.prisma.organization.create({
        data: {
          name: data.name,
          ownerkey: data.ownerkey,
        }
      });

      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async find(querie: OrgFindQuerie): Promise<OrganizationDTO> {
    try {
      const result = await this.prisma.organization.findFirst({
        where: querie
      });

      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(key: string): Promise<OrganizationDTO> {
    try {
      const result = await this.prisma.organization.delete({
        where: {
          id: key
        },
        include: {
          projects: true,
          members: true
        }
      });

      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}