'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Projects', 'owner', 'ownerkey');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Projects', 'ownerkey', 'owner')
  }
};
