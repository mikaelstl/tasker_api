'use strict';

const { DataType } = require('sequelize-typescript');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Tasks', {
      id: {
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
        unique: true,
      },
      code: {
        type: DataType.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
      },
      name: {
        type: DataType.STRING,
        allowNull: false,
        unique: true,
        defaultValue: ""
      },
      description: {
        type: DataType.STRING,
        allowNull: false,
        defaultValue: ""
      },
      project: {
        type: DataType.UUID,
        allowNull: false,
        references: {
          model: 'Projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      owner: {
        type: DataType.UUID,
        allowNull: false,
        references: {
          model: 'ProjectMembers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      stage: {
        type: DataType.ENUM(
          'PENDING',
          'IN_PROGRESS',
          'REVIEW',
          'DONE'
        ),
        defaultValue: 'PENDING',
        allowNull: false
      },
      priority: {
        type: DataType.ENUM(
          'LOW',
          'MEDIUM',
          'HIGH',
          'EXTREME'
        ),
        defaultValue: 'LOW',
        allowNull: false
      },
      due_date: {
        type: DataType.DATE,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Tasks');
  }
};
