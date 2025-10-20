/* import { Model, Column, DataType, ForeignKey, Table } from "sequelize-typescript";
import { User } from "./user.model";

@Table
export class Invite extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
    unique: true,
    primaryKey: true
  })
  id: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  })
  pending: boolean;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'username'
    },
    unique: true
  })
  sender: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'username'
    },
    unique: true
  })
  receiver: User;
} */