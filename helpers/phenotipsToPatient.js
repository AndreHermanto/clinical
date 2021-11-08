module.exports = (phenotipsInput) => {
  var patients = [];

  phenotipsInput.forEach((ptPatient) => {
    // patient[0] = patient obj
    // patient[1] = array of phenotypes objs
    var patient = [{}, []];
    patient[0].patientId = ptPatient.report_id;

    // allergies presents as an array - implication n:m - but only observed n:1
    if (ptPatient.allergies) {
      patient[0].allergies = ptPatient.allergies[0] || "";
    }

    // globalAgeOfOnset presents as an array - implication n:m -
    // but only observed n:1
    if (
      ptPatient.global_age_of_onset &&
      ptPatient.global_age_of_onset.length > 0
    ) {
      patient[0].globalAgeOfOnset = ptPatient.global_age_of_onset[0].id;
    }

    if (ptPatient.family_history) {
      patient[0].consanguinity = ptPatient.family_history.consanguinity;
      patient[0].affectedRelatives = ptPatient.family_history.affectedRelatives;
    }

    // ethnicities presents as an array - implication n:m - but only observed
    // as n:1. In fact, multiple ethnicities are presented with "and" in the
    // one element
    if (ptPatient.ethnicity) {
      patient[0].maternalEthnicity = ptPatient.ethnicity.maternal_ethnicity[0];
      patient[0].paternalEthnicity = ptPatient.ethnicity.paternal_ethnicity[0];
    }

    patient[0].lifeStatus = ptPatient.lifeStatus;
    patient[0].sex = ptPatient.sex;

    ptPatient.features.forEach((phenotype) => {
      if (phenotype.observed === "yes") {
        phenotype.id = phenotype.id.replace(":", "_");
        patient[1].push(phenotype);
      }
    });
    patients.push(patient);
  });

  return patients;
};
