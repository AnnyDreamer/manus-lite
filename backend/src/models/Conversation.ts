import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

export interface ConversationAttributes {
  id: string
  messages: string // 存储为 JSON 字符串
  createdAt?: Date
  updatedAt?: Date
}

export class Conversation extends Model<ConversationAttributes> implements ConversationAttributes {
  public id!: string
  public messages!: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Conversation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    messages: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'conversations'
  }
)
