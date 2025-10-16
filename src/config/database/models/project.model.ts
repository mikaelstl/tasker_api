import { Checkpoint } from "./checkpoint.model";
import { Comment } from "./comment.model";
import { ProjectInvite } from "./project_invite.model";
import { ProjectMember } from "./project_member.model";
import { Task } from "./task.model";
import { User } from "./user.model";
import { Model, Column, DataType, ForeignKey, Table, HasMany, BelongsTo } from "sequelize-typescript";

export enum ProjectProgress {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED='PAUSED',
  COMPLETED = 'COMPLETED',
}

@Table
export class Project extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
    unique: true,
    primaryKey: true
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  description: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'username'
    }
  })
  ownerkey: string;

  @BelongsTo(() => User, 'ownerkey')
  owner: User;
  
  @Column({
    type: DataType.ENUM(...Object.values(ProjectProgress)),
    defaultValue: ProjectProgress.PENDING,
    allowNull: false,
  })
  progress: ProjectProgress;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  due_date: Date;

  @HasMany(() => ProjectMember, 'project')
  members: ProjectMember[];

  // @HasMany(() => ProjectInvite, 'project')
  // invites: ProjectInvite[];

  @HasMany(() => Task, 'project')
  tasks: Task[]

  @HasMany(() => Checkpoint, 'project')
  checkpoints: Checkpoint[];

  @HasMany(() => Comment, 'project')
  comments: Comment[];
}