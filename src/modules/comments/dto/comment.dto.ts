import { MemberDTO } from "@modules/members/dto/member.dto";
import { ProjectDTO } from "@modules/projects/dto/project.dto";

export interface CommentDTO {
  readonly id:          string;
  readonly content:     string;
  readonly date:        Date;
  readonly ownerkey:   string | null;
  readonly projectkey:  string;
  readonly created_at: Date;

  readonly owner?:   MemberDTO;
  readonly project?:  ProjectDTO;
}
