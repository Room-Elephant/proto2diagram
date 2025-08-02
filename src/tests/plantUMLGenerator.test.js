/**
 * Unit tests for PlantUMLGenerator
 */

import { PlantUMLGenerator } from "../plantUMLGenerator.js";
import { ProtoParser } from "../protoParser.js";

describe("PlantUMLGenerator", () => {
  let generator;
  let parser;

  beforeEach(() => {
    parser = new ProtoParser();
    generator = new PlantUMLGenerator(parser);
  });

  describe("generateFromRoot", () => {
    test("should generate basic PlantUML structure", () => {
      const proto = `
        syntax = "proto3";
        message User {
          string name = 1;
          int32 age = 2;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("@startuml");
      expect(result).toContain("@enduml");
      expect(result).toContain("!pragma useIntermediatePackages false");
      expect(result).toContain("skinparam componentStyle rectangle");
      expect(result).toContain("object User {");
      expect(result).toContain("name : string");
      expect(result).toContain("age : int32");
    });

    test("should generate PlantUML with package", () => {
      const proto = `
        syntax = "proto3";
        package com.example.api;
        message User {
          string name = 1;
        }
      `;

      const { root, packageName } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root, packageName);

      expect(result).toContain('package "com.example.api" {');
      expect(result).toContain("object User {");
      expect(result).toContain("name : string");
      expect(result).toContain("}"); // Package closing
    });

    test("should not create package for simple names", () => {
      const proto = `
        syntax = "proto3";
        package simple;
        message User {
          string name = 1;
        }
      `;

      const { root, packageName } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root, packageName);

      expect(result).not.toContain('package "simple" {');
      expect(result).toContain("object User {");
    });

    test("should throw error for null root", () => {
      expect(() => {
        generator.generateFromRoot(null);
      }).toThrow("Root namespace is required for PlantUML generation");
    });
  });

  describe("optional field markers", () => {
    test("should add ? marker for optional fields", () => {
      const proto = `
        syntax = "proto3";
        message User {
          string name = 1;
          optional string email = 2;
          optional int32 age = 3;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("name : string");
      expect(result).toContain("email : string ?");
      expect(result).toContain("age : int32 ?");
    });

    test("should add ? marker for oneof fields", () => {
      const proto = `
        syntax = "proto3";
        message Payment {
          oneof method {
            string credit_card = 1;
            string bank_account = 2;
          }
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("creditCard : string?");
      expect(result).toContain("bankAccount : string?");
    });

    test("should not add ? marker for required fields", () => {
      const proto = `
        syntax = "proto3";
        message User {
          string name = 1;
          int32 age = 2;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("name : string");
      expect(result).toContain("age : int32");
      expect(result).not.toContain("string?");
      expect(result).not.toContain("int32?");
    });
  });

  describe("oneof notes", () => {
    test("should generate oneof notes for mutually exclusive fields", () => {
      const proto = `
        syntax = "proto3";
        message BetQuoted {
          oneof betQuoted {
            BetQuotedSuccessful betQuotedSuccessful = 1;
            BetQuotedFailure betQuotedFailure = 2;
          }
        }
        message BetQuotedSuccessful { string id = 1; }
        message BetQuotedFailure { string id = 1; }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("note right of BetQuoted");
      expect(result).toContain("Only one of betQuotedSuccessful or betQuotedFailure is set");
      expect(result).toContain("end note");
    });

    test("should not generate notes for single oneof field", () => {
      const proto = `
        syntax = "proto3";
        message Test {
          oneof single {
            string value = 1;
          }
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).not.toContain("note right");
      expect(result).not.toContain("Only one of");
    });

    test("should handle multiple oneof groups", () => {
      const proto = `
        syntax = "proto3";
        message Test {
          oneof group1 {
            string option_a = 1;
            string option_b = 2;
          }
          oneof group2 {
            int32 value_x = 3;
            int32 value_y = 4;
          }
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("Only one of optionA or optionB is set");
      expect(result).toContain("Only one of valueX or valueY is set");
    });
  });

  describe("enums", () => {
    test("should generate enums correctly", () => {
      const proto = `
        syntax = "proto3";
        enum Status {
          UNKNOWN = 0;
          ACTIVE = 1;
          INACTIVE = 2;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("enum Status {");
      expect(result).toContain("UNKNOWN");
      expect(result).toContain("ACTIVE");
      expect(result).toContain("INACTIVE");
    });

    test("should generate nested enums within components", () => {
      const proto = `
        syntax = "proto3";
        message User {
          enum Status {
            UNKNOWN = 0;
            ACTIVE = 1;
          }
          Status status = 1;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain('component "User Types" {');
      expect(result).toContain("object User {");
      expect(result).toContain("enum Status {");
      expect(result).toContain("UNKNOWN");
      expect(result).toContain("ACTIVE");
      expect(result).toContain("status : Status");
    });

    test("should not create components for messages without nested enums", () => {
      const proto = `
        syntax = "proto3";
        message User {
          string name = 1;
          int32 age = 2;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).not.toContain("component");
      expect(result).toContain("object User {");
      expect(result).toContain("name : string");
      expect(result).toContain("age : int32");
    });
  });

  describe("component grouping", () => {
    test("should create components for messages with multiple nested enums", () => {
      const proto = `
        syntax = "proto3";
        message Config {
          enum Priority {
            LOW = 0;
            MEDIUM = 1;
            HIGH = 2;
          }
          enum Status {
            DRAFT = 0;
            ACTIVE = 1;
            DISABLED = 2;
          }
          Priority priority = 1;
          Status status = 2;
          string description = 3;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain('component "Config Types" {');
      expect(result).toContain("object Config {");
      expect(result).toContain("enum Priority {");
      expect(result).toContain("enum Status {");
      expect(result).toContain("LOW");
      expect(result).toContain("MEDIUM");
      expect(result).toContain("HIGH");
      expect(result).toContain("DRAFT");
      expect(result).toContain("ACTIVE");
      expect(result).toContain("DISABLED");
    });

    test("should handle relationships correctly with component-scoped enums", () => {
      const proto = `
        syntax = "proto3";
        message Task {
          enum State {
            PENDING = 0;
            RUNNING = 1;
            COMPLETED = 2;
          }
          State state = 1;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain('component "Task Types" {');
      expect(result).toContain('Task --o "1" State');
    });

    test("should group nested types with global types correctly", () => {
      const proto = `
        syntax = "proto3";
        
        enum GlobalStatus {
          UNKNOWN = 0;
          OK = 1;
          ERROR = 2;
        }
        
        message Request {
          enum RequestType {
            GET = 0;
            POST = 1;
            PUT = 2;
          }
          RequestType type = 1;
          GlobalStatus global_status = 2;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      // Should have component for Request with nested enum
      expect(result).toContain('component "Request Types" {');
      expect(result).toContain("enum RequestType {");

      // Should have global enum outside component
      expect(result).toContain("enum GlobalStatus {");
      expect(result).not.toContain('component "GlobalStatus');

      // Should have relationships to both
      expect(result).toContain('Request --o "1" RequestType');
      expect(result).toContain('Request --o "1" GlobalStatus');
    });

    test("should validate complete component structure", () => {
      const proto = `
        syntax = "proto3";
        message TestMessage {
          enum TestEnum {
            UNKNOWN = 0;
            ACTIVE = 1;
          }
          TestEnum status = 1;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      // Must have component wrapper
      expect(result).toContain('component "TestMessage Types" {');

      // Must have object definition inside component
      const componentStart = result.indexOf('component "TestMessage Types" {');
      const componentEnd = result.indexOf("}", componentStart + 1);
      const componentContent = result.substring(componentStart, componentEnd + 1);

      expect(componentContent).toContain("object TestMessage {");
      expect(componentContent).toContain("enum TestEnum {");
      expect(componentContent).toContain("status : TestEnum");
      expect(componentContent).toContain("UNKNOWN");
      expect(componentContent).toContain("ACTIVE");

      // Must have relationship
      expect(result).toContain('TestMessage --o "1" TestEnum');

      // Must NOT have prefixed enum name
      expect(result).not.toContain("TestMessage_TestEnum");
    });
  });

  describe("services", () => {
    test("should generate services with methods", () => {
      const proto = `
        syntax = "proto3";
        service UserService {
          rpc GetUser(GetUserRequest) returns (GetUserResponse);
          rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
        }
        message GetUserRequest { string id = 1; }
        message GetUserResponse { string name = 1; }
        message CreateUserRequest { string name = 1; }
        message CreateUserResponse { string id = 1; }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("control UserService {");
      expect(result).toContain("GetUser(GetUserRequest) : GetUserResponse");
      expect(result).toContain("CreateUser(CreateUserRequest) : CreateUserResponse");
    });

    test("should generate service relationships", () => {
      const proto = `
        syntax = "proto3";
        service UserService {
          rpc GetUser(UserRequest) returns (UserResponse);
        }
        message UserRequest { string id = 1; }
        message UserResponse { string name = 1; }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("UserService --> UserRequest");
      expect(result).toContain("UserService --> UserResponse");
    });
  });

  describe("relationships", () => {
    test("should generate message-to-message relationships", () => {
      const proto = `
        syntax = "proto3";
        message User {
          Address address = 1;
        }
        message Address {
          string street = 1;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain('User --* "1" Address');
    });

    test("should generate message-to-enum relationships", () => {
      const proto = `
        syntax = "proto3";
        message User {
          Status status = 1;
        }
        enum Status {
          UNKNOWN = 0;
          ACTIVE = 1;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain('User --o "1" Status');
    });

    test("should not duplicate relationships", () => {
      const proto = `
        syntax = "proto3";
        message User {
          Status status1 = 1;
          Status status2 = 2;
        }
        enum Status {
          UNKNOWN = 0;
          ACTIVE = 1;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      const statusRelations = result.split("\n").filter((line) => line.includes("User --o") && line.includes("Status"));
      expect(statusRelations).toHaveLength(1);
    });

    test("should handle repeated fields cardinality", () => {
      const proto = `
        syntax = "proto3";
        message User {
          repeated Address addresses = 1;
        }
        message Address {
          string street = 1;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain('User --* "0..*" Address');
    });

    test("should handle optional field cardinality", () => {
      const proto = `
        syntax = "proto3";
        message User {
          optional Address address = 1;
        }
        message Address {
          string street = 1;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain('User --* "0..1" Address');
    });
  });

  describe("map fields", () => {
    test("should handle map field display", () => {
      const proto = `
        syntax = "proto3";
        message User {
          map<string, Address> addresses = 1;
        }
        message Address {
          string street = 1;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("addresses : map<string, Address>");
    });

    test("should handle map with optional marker", () => {
      const proto = `
        syntax = "proto3";
        message User {
          optional map<string, int32> scores = 1;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("scores : map<string, int32>?");
    });
  });

  describe("package flattening logic", () => {
    test("should use package for meaningful names", () => {
      const packageInfo = generator.analyzePackageStructure({ nested: {} }, "com.example.api");

      expect(packageInfo.shouldUsePackage).toBe(true);
      expect(packageInfo.displayName).toBe("com.example.api");
    });

    test("should flatten simple package names", () => {
      const packageInfo = generator.analyzePackageStructure({ nested: {} }, "simple");

      expect(packageInfo.shouldUsePackage).toBe(false);
    });

    test("should flatten very long package names", () => {
      const packageInfo = generator.analyzePackageStructure(
        { nested: {} },
        "com.very.long.package.name.that.is.too.complex.test"
      );

      expect(packageInfo.shouldUsePackage).toBe(false);
    });

    test("should use package for event/service/api endings", () => {
      const eventPackage = generator.analyzePackageStructure({ nested: {} }, "com.example.event");

      const servicePackage = generator.analyzePackageStructure({ nested: {} }, "com.example.service");

      expect(eventPackage.shouldUsePackage).toBe(true);
      expect(servicePackage.shouldUsePackage).toBe(true);
    });
  });

  describe("edge cases", () => {
    test("should handle empty messages", () => {
      const proto = `
        syntax = "proto3";
        message Empty {}
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("object Empty {");
      expect(result).toContain("}");
    });

    test("should handle messages with only comments", () => {
      const proto = `
        syntax = "proto3";
        message CommentOnly {
          // Just a comment
          // Another comment
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("object CommentOnly {");
    });

    test("should handle well-known types", () => {
      const proto = `
        syntax = "proto3";
        import "google/protobuf/timestamp.proto";
        message Event {
          google.protobuf.Timestamp created_at = 1;
        }
      `;

      const { root } = parser.parseProtoString(proto);
      const result = generator.generateFromRoot(root);

      expect(result).toContain("createdAt : google.protobuf.Timestamp");
      // Should not create relationship to well-known type
      expect(result).not.toContain('Event --* "1" google.protobuf.Timestamp');
    });
  });
});
