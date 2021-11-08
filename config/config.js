require("dotenv").config();

// none of these are used - it's needed to make sequelize happy
// sequelize probably isn't needed either, but it seeds the database for now

module.exports = {
  development: {
    database: "dev",
    storage: "::memory",
    host: "localhost",
    dialect: "sqlite",
  },
  test: {
    database: "test",
    storage: "::memory",
    host: "localhost",
    dialect: "sqlite",
  },
  production: {
    database: "prod",
    storage: "::memory",
    host: "localhost",
    dialect: "sqlite",
  },
};
