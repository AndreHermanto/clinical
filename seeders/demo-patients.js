"use strict";
const fs = require("fs");
var phenotipsToPatient = require("../helpers/phenotipsToPatient");
var neo4j = require("neo4j-driver");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */

    const file = fs.readFileSync(
      "/clinical/data/phenotips_2021-03-22_17-00.json"
    );
    const phenotipsInput = JSON.parse(file.toString());
    const patients = phenotipsToPatient(phenotipsInput);

    const driver = neo4j.driver(
      `bolt://clinical-db:7687`,
      neo4j.auth.basic("neo4j", process.env.NEO4J_PASS)
    );

    for (const patient of patients) {
      const session = driver.session();
      await session.run("MERGE (a:Cohort {cohort: 'Demo'}) RETURN a");

      var clinicalInfo = "";

      for (const [key, value] of Object.entries(patient[0])) {
        if (key === "familyHistory" || key === "medicalHistory") continue;
        clinicalInfo += ` ${key}: '${value}',`;
      }
      clinicalInfo = clinicalInfo.slice(0, -1);

      try {
        await session.run(
          "MERGE (a:Patient {cohort: 'Demo'," + clinicalInfo + "}) RETURN a"
        );
        for (const phenotype of patient[1]) {
          await session.run(
            "MATCH\
              (a:Patient),\
              (b:Class)\
             WHERE a.patientId = $patientId AND b.name = $phenotypeId\
             MERGE (a)-[r:HAS_PHENOTYPE]->(b)\
             RETURN r",
            {
              patientId: patient[0].patientId,
              phenotypeId: phenotype.id,
            }
          );
        }
      } finally {
        await session.close();
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    await queryInterface.bulkDelete("Demo", null, {});
  },
};
