module.exports = (trelloInput) => {
  var patients = [];

  trelloInput.forEach((ACPatient) => {
    // patient[0] = patient obj
    // patient[1] = array of phenotypes objs
    var patient = [{}, []];

    patient[0].patientId = ACPatient.externalIDs;
    patient[0].sex = ACPatient.sex;
    patient[0].ethnicity = ACPatient["Participant Ethnicity"];
    patient[0].maternalEthnicity = ACPatient["Maternal Ethnicity"];
    patient[0].paternalEthnicity = ACPatient["Paternal Ethnicity"];
    patient[0].hasAffectedSibling = ACPatient["Is there an affected sibling?"];
    patient[0].numberOfAffectedSiblings =
      ACPatient["Number of affected siblings:"];
    patient[0].hasAffectedChild = ACPatient["Is there an affected child?"];
    patient[0].numberOfAffectedChildren =
      ACPatient["Number of affected children:"];
    patient[0].consanguinity = ACPatient["Consanguinity"];
    patient[0].numberOfVariantsrReported =
      ACPatient["Number of variants reported"];
    patient[0].relevantPregnancyInformation =
      ACPatient["Relevant pregnancy information"];
    patient[0].variantClasses = ACPatient["Variant class"];
    patient[0].variantTypes = ACPatient["Variant type"];
    patient[0].variantZygosities = ACPatient["Variant Zygosity"];

    ACPatient["Principal phenotypic features"].forEach((phenotype) => {
      if (phenotype.startsWith("HP")) {
        phenotype = phenotype.split("|")[1];
      }
      patient[1].push(phenotype);
    });

    patients.push(patient);
  });

  return patients;
};
