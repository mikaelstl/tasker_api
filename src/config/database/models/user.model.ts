import { Column, DataType, HasMany, Table, Model, BelongsToMany } from "sequelize-typescript";
import { Invite } from "./invite.model";
import { Project } from "./project.model";
import { Relation } from "./relation.model";
import { ProjectMember } from "./project_member.model";
import { Comment } from "./comment.model";

@Table
export class User extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
    unique: true
  })
  id: string
  
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    primaryKey: true
  })
  username: string
  
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true
  })
  email: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  enterprise: boolean;

  // @HasMany(() => Invite, 'sender' && 'receiver')
  // invites: Invite[];

  @BelongsToMany(() => User, () => Relation, 'user', 'related')
  relations: User[];

  @HasMany(() => Project, 'owner')
  projects: Project[];

  @HasMany(() => ProjectMember, 'user')
  member: ProjectMember[];

  @HasMany(() => Comment, 'owner')
  comments: Comment[]
}