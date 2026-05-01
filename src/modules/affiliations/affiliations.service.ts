import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { OrgRole } from "generated/prisma";
import { AffiliationRepository } from "./affiliations.repository";
import { DefineAffiliationDTO } from "./dto/define.dto";
import { AffiliationDTO } from "./dto/affiliation.dto";
import { APIMessage } from "@interfaces/ApiMessage";
import { AccessValidator } from "@interfaces/AccessValidator";

// type ListMethodCommand = {
//   [key: string]: (key: string) => Promise<ProjectDTO[]>
// }

type AffiliationRoleTrasistion = {
  [ key in OrgRole ]: (affiliation: AffiliationDTO) => AffiliationDTO
}

@Injectable()
export class AffiliationService implements AccessValidator {
  private logger: Logger = new Logger('AffiliationService');

  constructor(
    private readonly repository: AffiliationRepository,
  ) { }

  async create(data: DefineAffiliationDTO) {
    return this.repository.create(data);
  }

  async delete(key: string) {
    return this.repository.delete(key);
  }

  async promote(key: string): Promise<AffiliationDTO | APIMessage> {
    const RolePromotes: AffiliationRoleTrasistion = {
      'MEMBER': (affiliation: AffiliationDTO) => {
                    affiliation.role = OrgRole.MANAGER
                    return affiliation;
                  },
      'MANAGER': (affiliation: AffiliationDTO) => { 
                    affiliation.role = OrgRole.OWNER
                    return affiliation;
                  },
      'OWNER': (affiliation: AffiliationDTO) => { return null }
    }

    try {
      const value = await this.repository.find(key);

      if (value.role === OrgRole.OWNER) {
        return {
          message: `YOUR HAVE THE MAX ROLE: OWNER. IT IS NOT POSSIBLE TO PROMOTE.`,
          timestamp: new Date().toISOString()
        } as APIMessage;
      }

      const data = RolePromotes[value.role](value);

      const result = await this.repository.update(key, data);

      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async demote(key: string): Promise<AffiliationDTO | APIMessage> {
    const RolePromotes: AffiliationRoleTrasistion = {
      'MEMBER': (affiliation: AffiliationDTO) => { return null },
      'MANAGER': (affiliation: AffiliationDTO) => { 
                    affiliation.role = OrgRole.MEMBER
                    return affiliation;
                  },
      'OWNER': (affiliation: AffiliationDTO) => { 
                    affiliation.role = OrgRole.MANAGER
                    return affiliation;
                  }
    }

    try {
      const value = await this.repository.find(key);

      if (value.role === OrgRole.OWNER) {
        return {
          message: `YOUR HAVE THE MAX ROLE: OWNER. IT IS NOT POSSIBLE TO PROMOTE.`,
          timestamp: new Date().toISOString()
        } as APIMessage;
      }

      const data = RolePromotes[value.role](value);

      const result = await this.repository.update(key, data);
      
      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async findByUserOrgKey(
    userkey: string,
    orgkey: string
  ) {
    try {
      const result = await this.repository.findWithQueries({
        userkey,
        orgkey
      });

      if (!result) {
        throw new NotFoundException("This Member don't exists in this Organization.")
      }

      return result;
    } catch (err: any) {
      throw new BadRequestException(err.message)
    }
  }

  async belongs(subjectkey: string, targetkey: string): Promise<boolean> {
    return false;
  }
}