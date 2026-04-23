import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import { DefineAffiliationDTO } from "./dto/define.dto";
import { AffiliationDTO } from "./dto/affiliation.dto";
import { AffiliationQuery } from "./dto/query.dto";

@Injectable()
export class AffiliationRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(data: DefineAffiliationDTO): Promise<AffiliationDTO> {
    try {
      const result = await this.prisma.affiliation.create({
        data: {
          userkey: data.userkey,
          orgkey: data.orgkey,
          role: data.role
        }
      });

      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(id: string): Promise<AffiliationDTO> {
    try {
      const result = await this.prisma.affiliation.delete({
        where: {
          id: id
        }
      });

      if (!result) {
        throw new NotFoundException();
      }

      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async update(key:string, update: AffiliationDTO): Promise<AffiliationDTO> {
    const result = await this.prisma.affiliation.update({
      where: {
        id: key
      },
      data: update
    });
    
    return result;
  }

  async find(key: string): Promise<AffiliationDTO> {
    const value = await this.prisma.affiliation.findUnique({
      where: {
        id: key
      }
    });

    return value;
  }

  async findWithQueries(queries: AffiliationQuery): Promise<AffiliationDTO> {
    const value = await this.prisma.affiliation.findFirst({
      where: queries
    });

    return value;
  }
}