// Library-specific configuration for proto parsing and diagram generation
export const CONFIG = {
  PLANTUML_ENDPOINT: "http://www.plantuml.com/plantuml/img/",
  WELL_KNOWN_TYPE_PREFIX: "google.protobuf.",
  UML: {
    RELATIONSHIPS: {
      COMPOSITION: "--*",
      AGGREGATION: "--o",
      ASSOCIATION: "-->",
    },
    CARDINALITY: {
      OPTIONAL: '"0..1"',
      REQUIRED: '"1"',
      MULTIPLE: '"0..*"',
    },
  },
};
