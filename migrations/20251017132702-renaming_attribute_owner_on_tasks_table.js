'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Tasks', 'owner', 'ownerkey');
    await queryInterface.renameColumn('ProjectMembers', 'user', 'userkey');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Tasks', 'ownerkey', 'owner');
    await queryInterface.renameColumn('ProjectMembers', 'userkey', 'user');
  }
};
