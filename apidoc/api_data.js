define({ "api": [
  {
    "type": "get",
    "url": "/graph/like/:patientId?fuzz:=fuzz",
    "title": "Get graph of similar patients",
    "name": "GetGraphLikePatient",
    "group": "External",
    "description": "<p>Get the Neo4J graph of /neo4j/patients/like/:patientId</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The JWT token</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "patientId",
            "description": "<ul> <li>The patient ID</li> </ul>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "fuzz",
            "description": "<ul> <li>The fuzz factor for the search (number of hops away)</li> </ul>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "graph",
            "description": "<ul> <li>The graph</li> </ul>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "graph.nodes",
            "description": "<ul> <li>The nodes</li> </ul>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "graph.edges",
            "description": "<ul> <li>The edges</li> </ul>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/neo4j.js",
    "groupTitle": "External"
  },
  {
    "type": "get",
    "url": "/graph/with/:label?fuzz=:fuzz&cutoff=:cutoff&limitation=:limiation",
    "title": "Get graph of patients with phenotype",
    "name": "GetGraphWithPhenotype",
    "group": "External",
    "description": "<p>Get the Neo4J graph of /patients/with/:label</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The JWT token</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "label",
            "description": "<ul> <li>The phenotype label</li> </ul>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "fuzz",
            "description": "<ul> <li>The fuzz factor for the search (number of hops away)</li> </ul>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "cutoff",
            "description": "<ul> <li>The cutoff for the number of patients</li> </ul>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "limitation",
            "description": "<ul> <li>A HPO term that patients must also have</li> </ul>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "graph",
            "description": "<ul> <li>The graph</li> </ul>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "graph.nodes",
            "description": "<ul> <li>The nodes</li> </ul>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "graph.edges",
            "description": "<ul> <li>The edges</li> </ul>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/neo4j.js",
    "groupTitle": "External"
  },
  {
    "type": "get",
    "url": "/neo4j/patients/:id",
    "title": "Get patient",
    "name": "GetPatient",
    "group": "External",
    "description": "<p>Get patient by id</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The JWT token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "patient",
            "description": "<ul> <li>The patient</li> </ul>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/neo4j.js",
    "groupTitle": "External"
  },
  {
    "type": "get",
    "url": "/neo4j/patients/all?cohort=:cohort",
    "title": "Get all patients",
    "name": "GetPatients",
    "group": "External",
    "description": "<p>Get all patients a token has permission for, or all patients in the cohort specified</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The JWT token</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "cohort",
            "description": "<ul> <li>The cohort to get patients for. If not provided, all cohorts are returned</li> </ul>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "patients",
            "description": "<ul> <li>The patients a token is authorised for</li> </ul>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/neo4j.js",
    "groupTitle": "External"
  },
  {
    "type": "get",
    "url": "/patients/with/:label?fuzz=:fuzz&cutoff=:cutoff&limitation=:limiation",
    "title": "Get patients with phenotype",
    "name": "GetPatientsWithPhenotype",
    "group": "External",
    "description": "<p>Get patients with a phenotype</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The JWT token</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "label",
            "description": "<ul> <li>The phenotype label</li> </ul>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "fuzz",
            "description": "<ul> <li>The fuzz factor for the search (number of hops away)</li> </ul>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "cutoff",
            "description": "<ul> <li>The cutoff for the number of patients</li> </ul>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "limitation",
            "description": "<ul> <li>A HPO term that patients must also have</li> </ul>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "res",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "res.overall",
            "description": "<ul> <li>Array of matchinng phenotype objects, each of which has a patient array</li> </ul>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "res.perCohort",
            "description": "<ul> <li>As above but broken down by cohort</li> </ul>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/neo4j.js",
    "groupTitle": "External"
  },
  {
    "type": "get",
    "url": "/patients/like/:id?fuzz=:fuzz",
    "title": "Get similar patients",
    "name": "GetSimilarPatients",
    "group": "External",
    "description": "<p>Get similar patients to the patient specified</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The JWT token</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<ul> <li>The patient id</li> </ul>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "fuzz",
            "description": "<ul> <li>The fuzz factor for the search (number of hops away)</li> </ul>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "patients",
            "description": "<ul> <li>The patients</li> </ul>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "res.overall",
            "description": "<ul> <li>Array of matchinng phenotype objects, each of which has a patient array</li> </ul>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "res.perCohort",
            "description": "<ul> <li>As above but broken down by cohort</li> </ul>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/neo4j.js",
    "groupTitle": "External"
  },
  {
    "type": "get",
    "url": "/api/neo4j/cohorts",
    "title": "Get all cohorts",
    "name": "GetCohorts",
    "group": "Internal",
    "description": "<p>Get all cohorts a token is authorised for</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>The JWT token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "cohorts",
            "description": "<ul> <li>The cohorts a token is authorised for</li> </ul>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/neo4j.js",
    "groupTitle": "Internal"
  }
] });
