/**
 * Unit tests for ProtoParser
 */

import { ProtoParser } from "../protoParser.js";

describe("ProtoParser", () => {
  let parser;

  beforeEach(() => {
    parser = new ProtoParser();
  });

  describe("parseProtoString", () => {
    test("should parse simple message successfully", () => {
      const proto = `
        syntax = "proto3";
        message User {
          string name = 1;
          int32 age = 2;
        }
      `;

      const result = parser.parseProtoString(proto);

      expect(result).toHaveProperty("root");
      expect(result).toHaveProperty("knownTypes");
      expect(result).toHaveProperty("packageName");
      expect(result.knownTypes.has("User")).toBe(true);
    });

    test("should extract package name correctly", () => {
      const proto = `
        syntax = "proto3";
        package com.example.test;
        message User {
          string name = 1;
        }
      `;

      const result = parser.parseProtoString(proto);
      expect(result.packageName).toBe("com.example.test");
    });

    test("should handle proto without package", () => {
      const proto = `
        syntax = "proto3";
        message User {
          string name = 1;
        }
      `;

      const result = parser.parseProtoString(proto);
      expect(result.packageName).toBeNull();
    });

    test("should throw error for invalid proto syntax", () => {
      const invalidProto = "invalid proto syntax";

      expect(() => {
        parser.parseProtoString(invalidProto);
      }).toThrow("Failed to parse protobuf content");
    });

    test("should throw error for empty content", () => {
      expect(() => {
        parser.parseProtoString("");
      }).toThrow("Proto content must be a non-empty string");
    });

    test("should throw error for null content", () => {
      expect(() => {
        parser.parseProtoString(null);
      }).toThrow("Proto content must be a non-empty string");
    });
  });

  describe("extractFieldType", () => {
    test("should extract simple field type", () => {
      const field = { name: "test", type: "string" };
      const result = parser.extractFieldType(field, "TestMessage");
      expect(result).toBe("string");
    });

    test("should throw error for field without type", () => {
      const field = { name: "test" };
      expect(() => {
        parser.extractFieldType(field, "TestMessage");
      }).toThrow("Field test has no type defined");
    });

    test("should throw error for null field", () => {
      expect(() => {
        parser.extractFieldType(null, "TestMessage");
      }).toThrow("Field cannot be null or undefined");
    });
  });

  describe("isWellKnownType", () => {
    test("should identify Google well-known types", () => {
      expect(parser.isWellKnownType("google.protobuf.Timestamp")).toBe(true);
      expect(parser.isWellKnownType("google.protobuf.Duration")).toBe(true);
      expect(parser.isWellKnownType("google.protobuf.Any")).toBe(true);
    });

    test("should not identify custom types as well-known", () => {
      expect(parser.isWellKnownType("User")).toBe(false);
      expect(parser.isWellKnownType("com.example.CustomMessage")).toBe(false);
    });
  });

  describe("getCardinality", () => {
    test("should return MULTIPLE for repeated fields", () => {
      const field = { repeated: true, name: "items" };
      const result = parser.getCardinality(field);
      expect(result).toBe("0..*");
    });

    test("should return MULTIPLE for map fields", () => {
      const field = { map: true, name: "mapping" };
      const result = parser.getCardinality(field);
      expect(result).toBe("0..*");
    });

    test("should return OPTIONAL for optional fields", () => {
      const field = { rule: "optional", name: "optional_field" };
      const result = parser.getCardinality(field);
      expect(result).toBe("0..1");
    });

    test("should return OPTIONAL for oneof fields", () => {
      const field = { partOf: { name: "choice" }, name: "option_a" };
      const result = parser.getCardinality(field);
      expect(result).toBe("0..1");
    });

    test("should return REQUIRED for regular fields", () => {
      const field = { name: "required_field" };
      const result = parser.getCardinality(field);
      expect(result).toBe("1");
    });

    test("should return REQUIRED for null field", () => {
      const result = parser.getCardinality(null);
      expect(result).toBe("1");
    });
  });

  describe("isOptionalField", () => {
    test("should identify optional rule fields as optional", () => {
      const field = { rule: "optional" };
      expect(parser.isOptionalField(field)).toBe(true);
    });

    test("should identify oneof fields as optional", () => {
      const field = { partOf: { name: "choice" } };
      expect(parser.isOptionalField(field)).toBe(true);
    });

    test("should not identify regular fields as optional", () => {
      const field = { name: "regular_field" };
      expect(parser.isOptionalField(field)).toBe(false);
    });
  });

  describe("getRelationshipType", () => {
    beforeEach(() => {
      // Setup some known enum types for testing
      parser.knownEnumTypes.add("Status");
      parser.knownEnumTypes.add("Priority");
    });

    test("should return AGGREGATION for enum types", () => {
      const result = parser.getRelationshipType("Status");
      expect(result).toBe("--o");
    });

    test("should return COMPOSITION for message types", () => {
      const result = parser.getRelationshipType("User");
      expect(result).toBe("--*");
    });

    test("should return COMPOSITION for unknown types", () => {
      const result = parser.getRelationshipType("UnknownType");
      expect(result).toBe("--*");
    });

    test("should return COMPOSITION for null type", () => {
      const result = parser.getRelationshipType(null);
      expect(result).toBe("--*");
    });
  });

  describe("toCamelCase", () => {
    test("should convert snake_case to camelCase", () => {
      expect(parser.toCamelCase("user_name")).toBe("userName");
      expect(parser.toCamelCase("first_name_last_name")).toBe("firstNameLastName");
    });

    test("should handle single words", () => {
      expect(parser.toCamelCase("user")).toBe("user");
      expect(parser.toCamelCase("name")).toBe("name");
    });

    test("should handle already camelCase strings", () => {
      expect(parser.toCamelCase("userName")).toBe("userName");
      expect(parser.toCamelCase("firstName")).toBe("firstName");
    });

    test("should handle empty strings", () => {
      expect(parser.toCamelCase("")).toBe("");
    });
  });

  describe("complex proto parsing", () => {
    test("should parse proto with nested messages and enums", () => {
      const proto = `
        syntax = "proto3";
        package com.example;
        
        message User {
          string name = 1;
          enum Status {
            UNKNOWN = 0;
            ACTIVE = 1;
            INACTIVE = 2;
          }
          Status status = 2;
          Address address = 3;
        }
        
        message Address {
          string street = 1;
          string city = 2;
        }
      `;

      const result = parser.parseProtoString(proto);

      expect(result.packageName).toBe("com.example");
      expect(result.knownTypes.has("User")).toBe(true);
      expect(result.knownTypes.has("Address")).toBe(true);
    });

    test("should parse proto with services", () => {
      const proto = `
        syntax = "proto3";
        
        service UserService {
          rpc GetUser(GetUserRequest) returns (GetUserResponse);
          rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
        }
        
        message GetUserRequest {
          string id = 1;
        }
        
        message GetUserResponse {
          User user = 1;
        }
        
        message User {
          string name = 1;
        }
      `;

      const result = parser.parseProtoString(proto);

      expect(result.knownTypes.has("GetUserRequest")).toBe(true);
      expect(result.knownTypes.has("GetUserResponse")).toBe(true);
      expect(result.knownTypes.has("User")).toBe(true);
    });
  });
});
