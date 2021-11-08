"use strict";
const fs = require("fs");
var trelloToPatient = require("../helpers/ACToPatient");
var neo4j = require("neo4j-driver");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const file = fs.readFileSync("/clinical/data/acutecarepro.pheno.json");
    const trelloInput = JSON.parse(file.toString());
    const patients = trelloToPatient(trelloInput);

    const driver = neo4j.driver(
      `bolt://clinical-db:7687`,
      neo4j.auth.basic("neo4j", process.env.NEO4J_PASS)
    );

    for (const patient of patients) {
      const session = driver.session();
      await session.run("MERGE (a:Cohort {cohort: 'Acute Care'}) RETURN a");

      var clinicalInfo = "";

      for (const [key, value] of Object.entries(patient[0])) {
        clinicalInfo += ` ${key}: '${value}',`;
      }
      clinicalInfo = clinicalInfo.slice(0, -1);

      try {
        await session.run(
          "MERGE (a:Patient {cohort: 'Acute Care'," +
            clinicalInfo +
            "}) RETURN a"
        );
        for (const phenotype of patient[1]) {
          await session.run(
            "MATCH\
              (a:Patient),\
              (b:Class)\
             WHERE a.patientId = $patientId AND b.label = $phenotypeName\
             MERGE (a)-[r:HAS_PHENOTYPE]->(b)\
             RETURN r",
            {
              patientId: patient[0].patientId,
              phenotypeName: phenotype,
            }
          );
        }
      } catch (err) {
        console.log(err);
      } finally {
        await session.close();
      }
    }
  },
};
