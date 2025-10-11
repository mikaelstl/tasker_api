import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "./user.model";
import { Project } from "./project.model";

@Table
export class Comment extends Model {

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
    allowNull: false
  })
  content: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'username'
    }
  })
  owner: User;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    references: {
      model: Project,
      key: 'id'
    }
  })
  project: User;

}