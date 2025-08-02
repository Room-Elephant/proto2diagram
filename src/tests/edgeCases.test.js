/**
 * Edge cases and regression tests
 */

import { Proto2Diagram } from "../index.js";

describe("Edge Cases and Regression Tests", () => {
  let lib;

  beforeEach(() => {
    lib = new Proto2Diagram();
  });

  describe("empty and minimal protos", () => {
    test("should handle proto with no messages", () => {
      const proto = `syntax = "proto3";`;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("@startuml");
      expect(result).toContain("@enduml");
      expect(result).toContain("!pragma useIntermediatePackages false");
      expect(result).toContain("skinparam componentStyle rectangle");
    });

    test("should handle proto with only comments", () => {
      const proto = `
        syntax = "proto3";
        // This is just a comment
        /* Multi-line comment
           with multiple lines */
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("@startuml");
      expect(result).toContain("@enduml");
    });

    test("should handle proto with only package declaration", () => {
      const proto = `
        syntax = "proto3";
        package com.example.empty;
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("@startuml");
      expect(result).toContain("@enduml");
      // Should not create package block for empty content
      expect(result).not.toContain('package "com.example.empty"');
    });
  });

  describe("complex nesting scenarios", () => {
    test("should handle deeply nested messages", () => {
      const proto = `
        syntax = "proto3";
        message Level1 {
          message Level2 {
            message Level3 {
              string deep_field = 1;
            }
            Level3 level3 = 1;
          }
          Level2 level2 = 1;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("object Level1 {");
      expect(result).toContain("object Level2 {");
      expect(result).toContain("object Level3 {");
      expect(result).toContain("deepField : string");
      expect(result).toContain('Level1 --* "1" Level2');
      expect(result).toContain('Level2 --* "1" Level3');
    });

    test("should handle multiple levels of nested enums with components", () => {
      const proto = `
        syntax = "proto3";
        message Outer {
          message Middle {
            enum InnerStatus {
              UNKNOWN = 0;
              ACTIVE = 1;
            }
            InnerStatus status = 1;
          }
          enum OuterStatus {
            PENDING = 0;
            COMPLETED = 1;
          }
          Middle middle = 1;
          OuterStatus status = 2;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      // Check for component structures
      expect(result).toContain('component "Outer Types" {');
      expect(result).toContain('component "Middle Types" {');

      // Check for original enum names within components
      expect(result).toContain("enum OuterStatus {");
      expect(result).toContain("enum InnerStatus {");

      // Check enum values
      expect(result).toContain("PENDING");
      expect(result).toContain("COMPLETED");
      expect(result).toContain("UNKNOWN");
      expect(result).toContain("ACTIVE");
    });

    test("should handle complex real-world component grouping", () => {
      const proto = `
        syntax = "proto3";
        package com.example.betting;
        
        message BetQuoted {
          oneof betQuoted {
            BetQuotedSuccessful betQuotedSuccessful = 1;
            BetQuotedFailure betQuotedFailure = 2;
          }
        }
        
        message BetQuotedFailure {
          enum QuoteStatus {
            UNKNOWN = 0;
            UNAVAILABLE = 1;
            BET_CLOSED = 2;
          }
          QuoteStatus quoteStatus = 1;
        }
        
        message LegFeatures {
          enum PricingStrategy {
            UNKNOWN_PRICING_STRATEGY = 0;
            SPORTSBOOK = 1;
            EXCHANGE = 2;
          }
          enum MarketMapping {
            UNKNOWN_MARKET_MAPPING = 0;
            STANDARD = 1;
            MARKET_MAPPING = 2;
          }
          PricingStrategy pricingStrategyWin = 1;
          MarketMapping marketMapping = 2;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      // Should create components for messages with nested enums
      expect(result).toContain('component "BetQuotedFailure Types" {');
      expect(result).toContain('component "LegFeatures Types" {');

      // Should contain original enum names
      expect(result).toContain("enum QuoteStatus {");
      expect(result).toContain("enum PricingStrategy {");
      expect(result).toContain("enum MarketMapping {");

      // Should NOT contain prefixed names
      expect(result).not.toContain("BetQuotedFailure_QuoteStatus");
      expect(result).not.toContain("LegFeatures_PricingStrategy");
      expect(result).not.toContain("LegFeatures_MarketMapping");

      // Should contain proper relationships
      expect(result).toContain('BetQuotedFailure --o "1" QuoteStatus');
      expect(result).toContain('LegFeatures --o "1" PricingStrategy');
      expect(result).toContain('LegFeatures --o "1" MarketMapping');
    });

    test("should maintain backward compatibility for global enums", () => {
      const proto = `
        syntax = "proto3";
        
        enum GlobalStatus {
          UNKNOWN = 0;
          ACTIVE = 1;
          INACTIVE = 2;
        }
        
        message User {
          string name = 1;
          GlobalStatus status = 2;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      // Global enums should not be in components
      expect(result).not.toContain('component "GlobalStatus');
      expect(result).toContain("enum GlobalStatus {");

      // Messages without nested enums should not be in components
      expect(result).not.toContain('component "User');
      expect(result).toContain("object User {");

      // Relationships should work normally
      expect(result).toContain('User --o "1" GlobalStatus');
    });
  });

  describe("field name edge cases", () => {
    test("should handle fields with underscores", () => {
      const proto = `
        syntax = "proto3";
        message Test {
          string first_name = 1;
          string last_name_suffix = 2;
          int32 user_id = 3;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("firstName : string");
      expect(result).toContain("lastNameSuffix : string");
      expect(result).toContain("userId : int32");
    });

    test("should handle fields with numbers", () => {
      const proto = `
        syntax = "proto3";
        message Test {
          string field1 = 1;
          string field2name = 2;
          string name3field = 3;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("field1 : string");
      expect(result).toContain("field2name : string");
      expect(result).toContain("name3field : string");
    });

    test("should handle reserved keywords as field names", () => {
      const proto = `
        syntax = "proto3";
        message Test {
          string class = 1;
          string package = 2;
          string import = 3;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("class : string");
      expect(result).toContain("package : string");
      expect(result).toContain("import : string");
    });
  });

  describe("complex map scenarios", () => {
    test("should handle nested maps", () => {
      const proto = `
        syntax = "proto3";
        message Complex {
          map<string, map<int32, string>> nested_maps = 1;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("nestedMaps : map<string, map<int32, string>>");
    });

    test("should handle maps with message values", () => {
      const proto = `
        syntax = "proto3";
        message User {
          string name = 1;
        }
        message Container {
          map<string, User> users = 1;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("users : map<string, User>");
      expect(result).toContain('Container --* "0..*" User');
    });

    test("should handle maps with enum values", () => {
      const proto = `
        syntax = "proto3";
        enum Status {
          UNKNOWN = 0;
          ACTIVE = 1;
        }
        message Container {
          map<string, Status> statuses = 1;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("statuses : map<string, Status>");
      expect(result).toContain('Container --o "0..*" Status');
    });
  });

  describe("oneof edge cases", () => {
    test("should handle oneof with single field", () => {
      const proto = `
        syntax = "proto3";
        message Test {
          oneof single {
            string value = 1;
          }
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("value : string ?");
      // Should not generate note for single field oneof
      expect(result).not.toContain("note right of Test");
    });

    test("should handle multiple oneof groups", () => {
      const proto = `
        syntax = "proto3";
        message MultipleChoices {
          oneof group1 {
            string option_a = 1;
            string option_b = 2;
          }
          oneof group2 {
            int32 value_x = 3;
            int32 value_y = 4;
          }
          string regular_field = 5;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("optionA : string ?");
      expect(result).toContain("optionB : string ?");
      expect(result).toContain("valueX : int32?");
      expect(result).toContain("valueY : int32?");
      expect(result).toContain("regularField : string");

      // Should generate notes for both groups
      expect(result).toContain("Only one of optionA or optionB is set");
      expect(result).toContain("Only one of valueX or valueY is set");
    });

    test("should handle oneof with complex types", () => {
      const proto = `
        syntax = "proto3";
        message Address {
          string street = 1;
        }
        message Phone {
          string number = 1;
        }
        message Contact {
          oneof contact_method {
            Address address = 1;
            Phone phone = 2;
            string email = 3;
          }
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("address : Address ?");
      expect(result).toContain("phone : Phone ?");
      expect(result).toContain("email : string ?");
      expect(result).toContain("Only one of address or phone or email is set");
    });
  });

  describe("package name edge cases", () => {
    test("should handle very short package names", () => {
      const proto = `
        syntax = "proto3";
        package a;
        message Test { string field = 1; }
      `;

      const result = lib.generatePlantUMLCode(proto);

      // Should flatten very short packages
      expect(result).not.toContain('package "a" {');
      expect(result).toContain("object Test {");
    });

    test("should handle extremely long package names", () => {
      const proto = `
        syntax = "proto3";
        package com.very.extremely.super.long.package.name.that.goes.on.forever.test;
        message Test { string field = 1; }
      `;

      const result = lib.generatePlantUMLCode(proto);

      // Should flatten very long packages
      expect(result).not.toContain('package "com.very.extremely');
      expect(result).toContain("object Test {");
    });

    test("should handle packages with numbers", () => {
      const proto = `
        syntax = "proto3";
        package com.example.v1.api;
        message Test { string field = 1; }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain('package "com.example.v1.api" {');
    });

    test("should handle packages with special naming", () => {
      const proto = `
        syntax = "proto3";
        package com.company.product.api;
        message Test { string field = 1; }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain('package "com.company.product.api" {');
    });
  });

  describe("relationship deduplication edge cases", () => {
    test("should not duplicate relationships with different cardinalities", () => {
      const proto = `
        syntax = "proto3";
        message Container {
          User single_user = 1;
          repeated User multiple_users = 2;
          optional User optional_user = 3;
        }
        message User {
          string name = 1;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      const relationships = result
        .split("\n")
        .filter((line) => line.includes("Container --*") && line.includes("User"));

      // Should have relationships with different cardinalities, but not duplicated
      expect(relationships.length).toBeGreaterThan(0);
      expect(relationships.length).toBeLessThanOrEqual(3);
    });

    test("should handle circular references", () => {
      const proto = `
        syntax = "proto3";
        message Node {
          string value = 1;
          Node parent = 2;
          repeated Node children = 3;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("object Node {");
      expect(result).toContain("parent : Node");
      expect(result).toContain("children : Node");

      // Should handle self-references
      const selfRelations = result.split("\n").filter((line) => line.includes("Node --*") && line.includes("Node"));
      expect(selfRelations.length).toBeGreaterThan(0);
    });
  });

  describe("service edge cases", () => {
    test("should handle service with no methods", () => {
      const proto = `
        syntax = "proto3";
        service EmptyService {}
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("control EmptyService {");
      expect(result).toContain("}");
    });

    test("should handle service with streaming methods", () => {
      const proto = `
        syntax = "proto3";
        service StreamService {
          rpc ServerStream(Request) returns (stream Response);
          rpc ClientStream(stream Request) returns (Response);
          rpc BidirectionalStream(stream Request) returns (stream Response);
        }
        message Request { string query = 1; }
        message Response { string result = 1; }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("control StreamService {");
      expect(result).toContain("ServerStream(Request) : Response");
      expect(result).toContain("ClientStream(Request) : Response");
      expect(result).toContain("BidirectionalStream(Request) : Response");
    });
  });

  describe("import and well-known types", () => {
    test("should handle Google well-known types without relationships", () => {
      const proto = `
        syntax = "proto3";
        import "google/protobuf/timestamp.proto";
        import "google/protobuf/duration.proto";
        
        message Event {
          google.protobuf.Timestamp created_at = 1;
          google.protobuf.Duration duration = 2;
          string name = 3;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("createdAt : google.protobuf.Timestamp");
      expect(result).toContain("duration : google.protobuf.Duration");
      expect(result).toContain("name : string");

      // Should not create relationships to well-known types
      expect(result).not.toContain('Event --* "1" google.protobuf.Timestamp');
      expect(result).not.toContain('Event --* "1" google.protobuf.Duration');
    });
  });

  describe("performance and large schemas", () => {
    test("should handle schemas with many messages", () => {
      const messageCount = 50;
      const messages = Array.from(
        { length: messageCount },
        (_, i) => `message Message${i} { string field${i} = 1; }`
      ).join("\n");

      const proto = `
        syntax = "proto3";
        package com.example.large;
        ${messages}
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("@startuml");
      expect(result).toContain("@enduml");
      expect(result).toContain('package "com.example.large" {');

      // Should contain all messages
      for (let i = 0; i < messageCount; i++) {
        expect(result).toContain(`object Message${i} {`);
        expect(result).toContain(`field${i} : string`);
      }
    });

    test("should handle messages with many fields", () => {
      const fieldCount = 50;
      const fields = Array.from({ length: fieldCount }, (_, i) => `string field${i} = ${i + 1};`).join("\n");

      const proto = `
        syntax = "proto3";
        message LargeMessage {
          ${fields}
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain("object LargeMessage {");

      // Should contain all fields
      for (let i = 0; i < fieldCount; i++) {
        expect(result).toContain(`field${i} : string`);
      }
    });
  });
});
