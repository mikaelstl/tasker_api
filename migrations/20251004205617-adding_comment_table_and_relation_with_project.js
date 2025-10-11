'use strict';

const { DataType } = require('sequelize-typescript');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Comments', {
      id: {
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
        unique: true,
        primaryKey: true
      },
      content: {
        type: DataType.STRING,
        allowNull: false,
      },
      owner: {
        type: DataType.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'username'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      project: {
        type: DataType.STRING,
        allowNull: false,
        references: {
          model: 'Projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    await queryInterface.addColumn(
      'Projetcs',
      'comments',
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Projects', 'priority');
    await queryInterface.dropTable('Comments')
  }
};
