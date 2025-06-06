const { sequelize } = require('../src/config/database');

// Set up test database
beforeAll(async () => {
    await sequelize.sync({ force: true });
});

// Clean up after tests
afterAll(async () => {
    await sequelize.close();
}); 