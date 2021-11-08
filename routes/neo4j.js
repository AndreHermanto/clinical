var express = require("express");
var router = express.Router();
var neo4j = require("neo4j-driver");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const mappings = require("../helpers/mappings");

// Authorization middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and
  // the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.AUTH0_DOMAIN}.well-known/jwks.json`,
  }),

  // Validate the audience and the issuer.
  audience: process.env.AUTH0_AUDIENCE,
  issuer: [process.env.AUTH0_DOMAIN],
  algorithms: ["RS256"],
});

/** Connects to the clinical database
 *
 * @returns {Object} { driver, session }
 */
const connectToNeo4j = () => {
  const driver = neo4j.driver(
    `bolt://clinical-db:7687`,
    neo4j.auth.basic("neo4j", process.env.NEO4J_PASS)
  );

  const session = driver.session();
  return { driver: driver, session: session };
};

/** Executes a Neo4J query
 *
 * @async
 * @param {String} query - The query to execute
 * @param {Object} params - Object of parameters to pass to the query
 *
 * @returns {Promise} result - The result of the query
 */
const executeQuery = async (query, params) => {
  const { driver, session } = connectToNeo4j();

  try {
    const result = await session.run(query, { ...params });
    return result;
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    await session.close();
    await driver.close();
  }
};

/**
 * Converts a Neo4J segment object into a node
 *
 * @param {Object} segmentProperties - The segment start/end properties object
 * @param {String} startId - The id of the start node (HPO or Patient) to color green
 *
 * @returns {Object} node - The node object
 */
const createNode = (segmentProperties, startId) => {
  /**
   * @typedef {Object} node
   * @property {String} id - The id of the node
   * @property {String} label - The label of the node
   * @property {String} color - The color of the node
   * @property {Number} radius - The radius of the node
   */
  let id = "";
  let label = "";
  let radius = 0;
  let color = "";

  if (segmentProperties.label === undefined) {
    // If the label is not defined, the segment is a patient
    id = segmentProperties.patientId;
    label = segmentProperties.patientId;
    radius = 10;
    color = startId === label ? "rgb(80, 175, 99)" : "rgb(97, 205, 187)";
  } else {
    // If the label is defined, the segment is a HPO term
    id = segmentProperties.name;
    label = segmentProperties.label;
    radius = 15;
    color = startId === label ? "rgb(80, 175, 99)" : "rgb(244, 117, 96)";
  }

  const node = {
    id: id,
    label: label,
    radius: radius,
    color: color,
  };

  return node;
};

/**
 * Converts a Neo4J path to a array of nodes and edges
 *
 * @param {Object} path - The path to convert
 * @param {String} startId - The id of the start node (HPO or Patient) to color green
 */
const parsePath = (path, startId) => {
  let nodes = [];
  let edges = [];

  path.records.forEach((record) => {
    const subPath = record.get(1);

    subPath.segments.forEach((segment) => {
      let startNode = createNode(segment.start.properties, startId);
      let endNode = createNode(segment.end.properties, startId);

      let edge = {
        id: segment.relationship.identity.low.toString(),
        from: startNode.id,
        to: endNode.id,
      };

      nodes.push(startNode);
      nodes.push(endNode);
      edges.push(edge);
    });
  });
  nodes = nodes.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
  edges = edges.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
  return { nodes, edges };
};

/**
 * @api {get} /api/neo4j/cohorts Get all cohorts
 * @apiName GetCohorts
 * @apiGroup Internal
 * @apiDescription Get all cohorts a token is authorised for
 *
 * @apiHeader {String} Authorization The JWT token
 *
 * @apiSuccess {String[]} cohorts - The cohorts a token is authorised for
 */
router.get("/cohorts", checkJwt, async (req, res, next) => {
  const permissions = req.user[process.env.AUTH0_CLAIMS];
  var cohorts = [];

  // get all cohort names
  const cohortsQuery = "MATCH (c:Cohort) RETURN c";
  const getCohorts = await executeQuery(cohortsQuery);

  if (!getCohorts) return res.sendStatus(500);

  // add to response if the user has permission for the cohort
  getCohorts.records.forEach((record) => {
    const cohort = record.get(0).properties.cohort;
    if (
      cohort === "Demo" ||
      permissions.includes(mappings[cohort] + "/pheno")
    ) {
      cohorts.push(cohort);
    }
  });

  return res.send(cohorts);
});

/**
 * @api {get} /neo4j/patients/all?cohort=:cohort Get all patients
 * @apiName GetPatients
 * @apiGroup External
 * @apiDescription Get all patients a token has permission for, or all patients in the cohort specified
 *
 * @apiHeader {String} Authorization The JWT token
 *
 * @apiParam {String} [cohort] - The cohort to get patients for. If not provided, all cohorts are returned
 *
 * @apiSuccess {Object[]} patients - The patients a token is authorised for
 */
router.get("/patients/all", checkJwt, async (req, res, next) => {
  const permissions = req.user[process.env.AUTH0_CLAIMS];
  var response = { overall: [], perCohort: [], numPatients: 0 };
  var cohorts = [];

  // get all cohort names
  const cohortsQuery = "MATCH (c:Cohort) RETURN c";
  const getCohorts = await executeQuery(cohortsQuery);

  if (!getCohorts) return res.sendStatus(500);

  getCohorts.records.forEach((record) => {
    cohorts.push(record.get(0).properties.cohort);
  });

  // for each cohort, construct a cohort object of patients
  // and also add its patients to the overall list
  for (var i = 0; i < cohorts.length; i++) {
    let cohort = cohorts[i];
    let cohortPerm = mappings[cohort];
    let cohortResponse = { cohort: cohort, patients: [], numPatients: 0 };

    // skip cohort if no permissions, or if not the one specified
    if (cohort !== "Demo" && !permissions.includes(cohortPerm + "/pheno")) {
      continue;
    } else if (req.query.cohort && req.query.cohort !== cohort) {
      continue;
    }

    // grab the patients and number of patients in the cohort
    const patientQuery =
      "MATCH (p:Patient {cohort: $cohort})-[:HAS_PHENOTYPE]->(ph:Class)\
       RETURN p{.*,  phenotypes: collect(properties(ph))}";
    const patientNumberQuery =
      "MATCH (p:Patient {cohort: $cohort})-[:HAS_PHENOTYPE]->(ph:Class)\
     RETURN COUNT(DISTINCT p)";
    const patientResult = await executeQuery(patientQuery, {
      cohort: cohort,
    });
    const patientNumberResult = await executeQuery(patientNumberQuery, {
      cohort: cohort,
    });

    cohortResponse.numPatients = patientNumberResult.records[0].get(0).low;

    // add each patient to the cohort object and the overall object
    patientResult.records.forEach((record) => {
      let patient = record.get(0);
      cohortResponse.patients.push(patient);
      response.overall.push(patient);
    });

    response.perCohort.push(cohortResponse);
  }

  return res.send(response);
});

/**
 * @api {get} /neo4j/patients/:id Get patient
 * @apiName GetPatient
 * @apiGroup External
 * @apiDescription Get patient by id
 *
 * @apiHeader {String} Authorization The JWT token
 *
 * @apiSuccess {Object} patient - The patient
 */
router.get("/patients/patient/:id", checkJwt, async (req, res, next) => {
  const permissions = req.user[process.env.AUTH0_CLAIMS];
  const id = req.params.id;

  // match to patient
  const patientQuery =
    "MATCH (patient:Patient {patientId: $patientId})\
  OPTIONAL MATCH (patient)-[:HAS_PHENOTYPE]-(phenotype:Class)\
  RETURN patient{.*, phenotypes: collect(properties(phenotype))}";

  const patientResult = await executeQuery(patientQuery, {
    patientId: id,
  });

  if (!patientResult.records[0]) return res.sendStatus(404);

  const patient = patientResult.records[0].get(0);

  // check permissions before sending
  permissions.includes(mappings[patient.cohort] + "/pheno") ||
  patient.cohort === "Demo"
    ? res.send(patient)
    : res.sendStatus(401);
});

/**
 * @api {get} /patients/like/:id?fuzz=:fuzz Get similar patients
 * @apiName GetSimilarPatients
 * @apiGroup External
 * @apiDescription Get similar patients to the patient specified
 *
 * @apiHeader {String} Authorization The JWT token
 *
 * @apiParam {String} id - The patient id
 * @apiParam {Number} fuzz - The fuzz factor for the search (number of hops away)
 *
 * @apiSuccess {Object[]} patients - The patients
 * @apiSuccess {Object[]} res.overall - Array of matchinng phenotype objects, each of which has a patient array
 * @apiSuccess {Object[]} res.perCohort - As above but broken down by cohort
 */
router.get("/patients/like/:id", checkJwt, async (req, res, next) => {
  const fuzz = req.query.fuzz;
  const permissions = req.user[process.env.AUTH0_CLAIMS];
  var response = { overall: [], perCohort: [], numPatients: 0 };
  var cohorts = [];

  if (typeof fuzz !== "string") {
    return res.send(400);
  }

  // get all cohorts
  const cohortsQuery = "MATCH (c:Cohort) RETURN c";
  const getCohorts = await executeQuery(cohortsQuery);

  if (!getCohorts) return res.sendStatus(500);

  // nicer iterating later
  getCohorts.records.forEach((record) => {
    cohorts.push(record.get(0).properties.cohort);
  });

  // for each cohort, construct a cohort object of patients
  for (var i = 0; i < cohorts.length; i++) {
    let cohort = cohorts[i];
    let cohortPerm = mappings[cohort];
    let cohortResponse = { cohort: cohort, patients: [], numPatients: 0 };

    // skip if no permissions, or if not the one specified
    if (cohort !== "Demo" && !permissions.includes(cohortPerm + "/pheno")) {
      continue;
    } else if (req.query.cohort && req.query.cohort !== cohort) {
      continue;
    }

    const patientQuery = `MATCH (a:Patient {patientId: $patientId})-[*0..${parseInt(
      fuzz
    )}]-(b:Patient {cohort: $cohort})-[]-(c:Class) WITH DISTINCT b, c RETURN b{.*, phenotypes: collect(properties(c))}`;
    const patientNumberQuery = `MATCH (a:Patient {patientId: $patientId})-[*0..${parseInt(
      fuzz
    )}]-(b:Patient {cohort: $cohort})-[]-(c:Class) WITH DISTINCT b, c RETURN COUNT(DISTINCT b)`;

    // get the patients
    const patientResult = await executeQuery(patientQuery, {
      patientId: req.params.id,
      cohort: cohort,
    });
    // get the number of patients
    const patientNumberResult = await executeQuery(patientNumberQuery, {
      patientId: req.params.id,
      cohort: cohort,
    });

    cohortResponse.numPatients = patientNumberResult.records[0].get(0).low;

    patientResult.records.forEach((record) => {
      let patient = record.get(0);
      cohortResponse.patients.push(patient);
      response.overall.push(patient);
    });

    response.perCohort.push(cohortResponse);
  }

  return res.send(response);
});

/**
 * @api {get} /patients/with/:label?fuzz=:fuzz&cutoff=:cutoff&limitation=:limiation Get patients with phenotype
 * @apiName GetPatientsWithPhenotype
 * @apiGroup External
 * @apiDescription Get patients with a phenotype
 *
 * @apiHeader {String} Authorization The JWT token
 *
 * @apiParam {String} label - The phenotype label
 * @apiParam {Number} fuzz - The fuzz factor for the search (number of hops away)
 * @apiParam {Number} cutoff - The cutoff for the number of patients
 * @apiParam {String} limitation - A HPO term that patients must also have
 *
 * @apiSuccess {Object[]} res
 * @apiSuccess {Object[]} res.overall - Array of matchinng phenotype objects, each of which has a patient array
 * @apiSuccess {Object[]} res.perCohort - As above but broken down by cohort
 */
router.get("/patients/with/:label", checkJwt, async (req, res, next) => {
  const permissions = req.user[process.env.AUTH0_CLAIMS];
  const fuzz = req.query.fuzz;
  const limitation = req.query.limitation;
  var cutoff = req.query.cutoff;
  var response = { overall: [], perCohort: [], cohortsDenied: [] };
  var cohorts = [];
  var allPhenotypes = {};

  if (typeof fuzz !== "string") {
    return res.send(400);
  }

  if (typeof cutoff !== "string") {
    cutoff = "0";
  }

  // get all cohorts
  const cohortsQuery = "MATCH (c:Cohort) RETURN c";
  const getCohorts = await executeQuery(cohortsQuery);

  if (!getCohorts) return res.sendStatus(500);

  // for nicer iterating later
  getCohorts.records.forEach((record) => {
    cohorts.push(record.get(0).properties.cohort);
  });

  for (var i = 0; i < cohorts.length; i++) {
    let cohort = cohorts[i];
    let cohortPerm = mappings[cohort];
    let cohortResponse = { cohort: cohort, phenotypes: [], numPatients: 0 };

    // setup neo4j query
    var baseQuery = "";
    var queryParams = {
      label: req.params.label,
      cohort: cohort,
      lim: undefined,
    };

    if (limitation === "") {
      baseQuery =
        "MATCH (inphen:Class {label: $label})-[:SCO*0.." +
        parseInt(fuzz) +
        "]-(relphen:Class)-[e]-(p:Patient {cohort: $cohort}) \
        WHERE size ((relphen)--(:Patient {cohort: $cohort})) >=" +
        parseInt(cutoff);
    } else {
      // if there is a limitation, add it to the query
      baseQuery =
        "MATCH (:Class {label: $label})-[:SCO*0.." +
        parseInt(fuzz) +
        "]-(relphen:Class)-[]-(p:Patient {cohort: $cohort})-[]-(:Class {label: $lim}) \
        WHERE size ((relphen)--(:Patient {cohort: $cohort})) >=" +
        parseInt(cutoff);

      queryParams.lim = limitation;
    }

    // get the patients
    const phenotypeQuery =
      baseQuery +
      " RETURN relphen{.label, .name, patients: collect(DISTINCT properties(p))}";
    // get the number of patients
    const patientNumberQuery = baseQuery + " RETURN COUNT(DISTINCT p)";

    const phenotypeResult = await executeQuery(phenotypeQuery, queryParams);
    const patientNumberResult = await executeQuery(
      patientNumberQuery,
      queryParams
    );

    cohortResponse.numPatients = patientNumberResult.records[0].get(0).low;

    // skip if no permissions, or if not the one specified
    if (cohort !== "Demo" && !permissions.includes(cohortPerm + "/pheno")) {
      // if there were patients, but no permissions, add to the list of cohorts denied
      if (cohortResponse.numPatients > 0) {
        response.cohortsDenied.push(cohort);
      }
      continue;
    } else if (req.query.cohort && req.query.cohort !== cohort) {
      continue;
    }

    // for each record, add the phenotype to the cohort level array and
    // the overall level array
    phenotypeResult.records.forEach((record) => {
      let phenotype = record.get(0);
      cohortResponse.phenotypes.push(phenotype);

      // if phenotype not already in overall array, add
      if (allPhenotypes[phenotype.name] === undefined) {
        allPhenotypes[phenotype.name] = {
          name: phenotype.name,
          label: phenotype.label,
          patients: [],
        };
      }
      allPhenotypes[phenotype.name].patients.push(...phenotype.patients);
    });

    response.perCohort.push(cohortResponse);
  }

  Object.values(allPhenotypes).forEach((value) => {
    response.overall.push(value);
  });

  return res.send(response);
});

/**
 * @api {get} /graph/with/:label?fuzz=:fuzz&cutoff=:cutoff&limitation=:limiation Get graph of patients with phenotype
 * @apiName GetGraphWithPhenotype
 * @apiGroup External
 * @apiDescription Get the Neo4J graph of /patients/with/:label
 * 
 * @apiHeader {String} Authorization The JWT token
 
 * @apiParam {String} label - The phenotype label
 * @apiParam {Number} fuzz - The fuzz factor for the search (number of hops away)
 * @apiParam {Number} cutoff - The cutoff for the number of patients
 * @apiParam {String} limitation - A HPO term that patients must also have
 * 
 * @apiSuccess {Object} graph - The graph
 * @apiSuccess {Object[]} graph.nodes - The nodes
 * @apiSuccess {Object[]} graph.edges - The edges
 */
router.get("/graph/with/:label", checkJwt, async (req, res, next) => {
  const permissions = req.user[process.env.AUTH0_CLAIMS];
  const fuzz = req.query.fuzz;
  const limitation = req.query.limitation;
  var cutoff = req.query.cutoff;
  var cohorts = [];

  if (typeof fuzz !== "string") {
    return res.send(400);
  }
  if (typeof cutoff !== "string") {
    cutoff = "0";
  }

  // get all cohorts
  const cohortsQuery = "MATCH (c:Cohort) RETURN c";
  const getCohorts = await executeQuery(cohortsQuery);

  if (!getCohorts) return res.sendStatus(500);

  // skip if no permissions
  getCohorts.records.forEach((record) => {
    let cohort = record.get(0).properties.cohort;
    if (
      cohort !== "Demo" &&
      !permissions.includes(mappings[cohort] + "/pheno")
    ) {
      return;
    }
    cohorts.push(record.get(0).properties.cohort);
  });

  // get path
  let query =
    `MATCH (m:Class {label: $label}) 
    CALL 
    { 
    WITH m
    MATCH path = (m)-[:SCO*0..` +
    parseInt(fuzz) +
    `]-(:Class)-[:HAS_PHENOTYPE]-(patient:Patient)
    WHERE patient.cohort IN $cohorts
    RETURN patient, collect(path)[0] AS path
    }
    RETURN m, path `;

  const graphRes = await executeQuery(query, {
    label: req.params.label,
    cohorts: cohorts,
  });

  if (!graphRes) return res.sendStatus(500);

  // parse the path and return
  let { nodes, edges } = parsePath(graphRes, req.params.label);
  res.send({ nodes: nodes, edges: edges });
});

/**
 * @api {get} /graph/like/:patientId?fuzz:=fuzz Get graph of similar patients
 * @apiName GetGraphLikePatient
 * @apiGroup External
 * @apiDescription Get the Neo4J graph of /neo4j/patients/like/:patientId
 *
 * @apiHeader {String} Authorization The JWT token
 *
 * @apiParam {String} patientId - The patient ID
 * @apiParam {Number} fuzz - The fuzz factor for the search (number of hops away)
 *
 * @apiSuccess {Object} graph - The graph
 * @apiSuccess {Object[]} graph.nodes - The nodes
 * @apiSuccess {Object[]} graph.edges - The edges
 */
router.get("/graph/like/:patientId", checkJwt, async (req, res, next) => {
  const permissions = req.user[process.env.AUTH0_CLAIMS];
  const fuzz = req.query.fuzz;
  var cohorts = [];

  if (typeof fuzz !== "string") {
    return res.send(400);
  }

  // get all cohorts
  const cohortsQuery = "MATCH (c:Cohort) RETURN c";
  const getCohorts = await executeQuery(cohortsQuery);

  // skip if no permissions
  if (!getCohorts) return res.sendStatus(500);
  getCohorts.records.forEach((record) => {
    let cohort = record.get(0).properties.cohort;
    if (
      cohort !== "Demo" &&
      !permissions.includes(mappings[cohort] + "/pheno")
    ) {
      return;
    }
    cohorts.push(record.get(0).properties.cohort);
  });

  // get path
  let query =
    `MATCH (m:Patient {patientId: $patientId}) 
    CALL 
    { 
      WITH m
      MATCH path = (m)-[*0..` +
    parseInt(fuzz) +
    `]-(patient:Patient)
      WHERE patient.cohort IN $cohorts
      RETURN patient, collect(path)[0] AS path
    }
    RETURN m, path`;

  const graphRes = await executeQuery(query, {
    patientId: req.params.patientId,
    cohorts: cohorts,
  });

  if (!graphRes) return res.sendStatus(500);

  // parse the path and return
  let { nodes, edges } = parsePath(graphRes, req.params.patientId);
  res.send({ nodes: nodes, edges: edges });
});
module.exports = router;
