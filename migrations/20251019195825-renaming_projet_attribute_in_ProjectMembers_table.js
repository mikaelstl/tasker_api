'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('ProjectMembers', 'project', 'projectkey');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('ProjectMembers', 'projectkey', 'project');
  }
};
