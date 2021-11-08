module.exports = (trelloInput) => {
  var patients = [];

  trelloInput.forEach((tPatient) => {
    // patient[0] = patient obj
    // patient[1] = array of phenotypes objs
    var patient = [{}, []];

    patient[0].patientId = tPatient.externalIDs;
    patient[0].gender = tPatient.Gender;

    tPatient.Condition.forEach((phenotype) => {
      patient[1].push(phenotype);
    });

    patients.push(patient);
  });

  return patients;
};
