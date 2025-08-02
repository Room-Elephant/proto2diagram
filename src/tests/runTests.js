#!/usr/bin/env node

/**
 * Simple test runner for proto2diagram library
 * This runs our comprehensive test suite without Jest complexity
 */

import { ProtoParser } from '../protoParser.js';
import { PlantUMLGenerator } from '../plantUMLGenerator.js';
import { Proto2Diagram } from '../index.js';
import { generatePlantUMLImageUrl, compressAndEncode } from '../plantumlEncoder.js';

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  describe(name, testFn) {
    console.log(`\n📋 ${name}`);
    console.log('='.repeat(50));
    testFn();
  }

  test(name, testFn) {
    try {
      testFn();
      console.log(`✅ ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      this.failed++;
      this.errors.push({ test: name, error: error.message });
    }
  }

  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
      },
      toContain: (substring) => {
        if (!actual.includes(substring)) {
          throw new Error(`Expected "${actual}" to contain "${substring}"`);
        }
      },
      not: {
        toContain: (substring) => {
          if (actual.includes(substring)) {
            throw new Error(`Expected "${actual}" not to contain "${substring}"`);
          }
        }
      },
      toHaveLength: (length) => {
        if (actual.length !== length) {
          throw new Error(`Expected length ${length}, got ${actual.length}`);
        }
      },
      toBeGreaterThan: (num) => {
        if (actual <= num) {
          throw new Error(`Expected ${actual} to be greater than ${num}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected ${actual} to be truthy`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected ${actual} to be falsy`);
        }
      },
      toThrow: (expectedError) => {
        try {
          actual();
          throw new Error('Expected function to throw an error');
        } catch (error) {
          if (expectedError && !error.message.includes(expectedError)) {
            throw new Error(`Expected error to contain "${expectedError}", got "${error.message}"`);
          }
        }
      }
    };
  }

  summary() {
    console.log('\n' + '='.repeat(60));
    console.log('🏁 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.passed + this.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);

    if (this.errors.length > 0) {
      console.log('\n🚨 FAILED TESTS:');
      this.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error.test}: ${error.error}`);
      });
    }

    return this.failed === 0;
  }
}

// Create test runner instance
const runner = new TestRunner();

// Proto Parser Tests
runner.describe('ProtoParser Tests', () => {
  const parser = new ProtoParser();

  runner.test('should parse simple proto', () => {
    const proto = `
      syntax = "proto3";
      message User {
        string name = 1;
        int32 age = 2;
      }
    `;
    const result = parser.parseProtoString(proto);
    runner.expect(result.knownTypes.has('User')).toBeTruthy();
  });

  runner.test('should extract package name', () => {
    const proto = `
      syntax = "proto3";
      package com.example.test;
      message User { string name = 1; }
    `;
    const result = parser.parseProtoString(proto);
    runner.expect(result.packageName).toBe('com.example.test');
  });

  runner.test('should handle optional fields', () => {
    const field = { rule: 'optional', name: 'test' };
    runner.expect(parser.isOptionalField(field)).toBeTruthy();
  });

  runner.test('should handle oneof fields', () => {
    const field = { partOf: { name: 'choice' }, name: 'test' };
    runner.expect(parser.isOptionalField(field)).toBeTruthy();
  });

  runner.test('should convert to camelCase', () => {
    runner.expect(parser.toCamelCase('user_name')).toBe('userName');
    runner.expect(parser.toCamelCase('first_name_last')).toBe('firstNameLast');
  });

  runner.test('should identify well-known types', () => {
    runner.expect(parser.isWellKnownType('google.protobuf.Timestamp')).toBeTruthy();
    runner.expect(parser.isWellKnownType('User')).toBeFalsy();
  });

  runner.test('should throw error for invalid proto', () => {
    runner.expect(() => parser.parseProtoString('invalid')).toThrow('Failed to parse protobuf content');
  });
});

// PlantUML Generator Tests
runner.describe('PlantUML Generator Tests', () => {
  const parser = new ProtoParser();
  const generator = new PlantUMLGenerator(parser);

  runner.test('should generate basic PlantUML structure', () => {
    const proto = `
      syntax = "proto3";
      message User {
        string name = 1;
        int32 age = 2;
      }
    `;
    const { root } = parser.parseProtoString(proto);
    const result = generator.generateFromRoot(root);
    
    runner.expect(result).toContain('@startuml');
    runner.expect(result).toContain('@enduml');
    runner.expect(result).toContain('!pragma useIntermediatePackages false');
    runner.expect(result).toContain('skinparam componentStyle rectangle');
    runner.expect(result).toContain('object User {');
    runner.expect(result).toContain('name : string');
    runner.expect(result).toContain('age : int32');
  });

  runner.test('should add optional markers', () => {
    const proto = `
      syntax = "proto3";
      message User {
        string name = 1;
        optional string email = 2;
      }
    `;
    const { root } = parser.parseProtoString(proto);
    const result = generator.generateFromRoot(root);
    
    runner.expect(result).toContain('name : string');
    runner.expect(result).toContain('email : string ?');
  });

  runner.test('should add repeated field markers', () => {
    const proto = `
      syntax = "proto3";
      import "google/protobuf/wrappers.proto";
      message User {
        string name = 1;
        repeated string tags = 2;
        repeated google.protobuf.StringValue groups = 3;
      }
    `;
    const { root } = parser.parseProtoString(proto);
    const result = generator.generateFromRoot(root);
    
    runner.expect(result).toContain('name : string');
    runner.expect(result).toContain('tags : string [ ]');
    runner.expect(result).toContain('groups : google.protobuf.StringValue [ ]');
  });

  runner.test('should generate oneof notes', () => {
    const proto = `
      syntax = "proto3";
      message Test {
        oneof choice {
          string option_a = 1;
          string option_b = 2;
        }
      }
    `;
    const { root } = parser.parseProtoString(proto);
    const result = generator.generateFromRoot(root);
    
    runner.expect(result).toContain('note right of Test');
    runner.expect(result).toContain('Only one of optionA or optionB is set');
    runner.expect(result).toContain('end note');
  });

  runner.test('should generate package when appropriate', () => {
    const proto = `
      syntax = "proto3";
      package com.example.api;
      message User { string name = 1; }
    `;
    const { root, packageName } = parser.parseProtoString(proto);
    const result = generator.generateFromRoot(root, packageName);
    
    runner.expect(result).toContain('package "com.example.api" {');
    runner.expect(result).toContain('object User {');
  });

  runner.test('should flatten simple packages', () => {
    const proto = `
      syntax = "proto3";
      package simple;
      message User { string name = 1; }
    `;
    const { root, packageName } = parser.parseProtoString(proto);
    const result = generator.generateFromRoot(root, packageName);
    
    runner.expect(result).not.toContain('package "simple" {');
    runner.expect(result).toContain('object User {');
  });

  runner.test('should generate enums correctly', () => {
    const proto = `
      syntax = "proto3";
      enum Status {
        UNKNOWN = 0;
        ACTIVE = 1;
      }
    `;
    const { root } = parser.parseProtoString(proto);
    const result = generator.generateFromRoot(root);
    
    runner.expect(result).toContain('enum Status {');
    runner.expect(result).toContain('UNKNOWN');
    runner.expect(result).toContain('ACTIVE');
  });
});

// Integration Tests
runner.describe('Integration Tests', () => {
  const lib = new Proto2Diagram();

  runner.test('should generate complete PlantUML diagram', () => {
    const proto = `
      syntax = "proto3";
      package com.example.test;
      
      message User {
        string name = 1;
        optional string email = 2;
        Status status = 3;
      }
      
      enum Status {
        UNKNOWN = 0;
        ACTIVE = 1;
      }
    `;

    const result = lib.generatePlantUMLCode(proto);
    
    runner.expect(result).toContain('@startuml');
    runner.expect(result).toContain('!pragma useIntermediatePackages false');
    runner.expect(result).toContain('skinparam componentStyle rectangle');
    runner.expect(result).toContain('package "com.example.test" {');
    runner.expect(result).toContain('object User {');
    runner.expect(result).toContain('name : string');
    runner.expect(result).toContain('email : string ?');
    runner.expect(result).toContain('enum Status {');
    runner.expect(result).toContain('User --o "1" Status');
    runner.expect(result).toContain('@enduml');
  });

  runner.test('should handle complex proto with all features', () => {
    const complexProto = `
      syntax = "proto3";
      package com.flutter.gbp.fcq.quote.event;

      message BetQuoted {
        oneof betQuoted {
          BetQuotedSuccessful betQuotedSuccessful = 1;
          BetQuotedFailure betQuotedFailure = 2;
        }
      }

      message BetQuotedSuccessful {
        string betId = 1;
        Platform platform = 2;
        optional double wealthMargin = 3;
      }

      message BetQuotedFailure {
        string betId = 1;
        Platform platform = 2;
        enum QuoteStatus {
          UNKNOWN = 0;
          UNAVAILABLE = 1;
        }
        QuoteStatus quoteStatus = 3;
      }

      enum Platform {
        UNKNOWN = 0;
        ONLINE = 1;
      }
    `;

    const result = lib.generatePlantUMLCode(complexProto);
    
    // Check all major features
    runner.expect(result).toContain('!pragma useIntermediatePackages false');
    runner.expect(result).toContain('skinparam componentStyle rectangle');
    runner.expect(result).toContain('package "com.flutter.gbp.fcq.quote.event" {');
    runner.expect(result).toContain('note right of BetQuoted');
    runner.expect(result).toContain('Only one of betQuotedSuccessful or betQuotedFailure is set');
    runner.expect(result).toContain('wealthMargin : double ?');
    runner.expect(result).toContain('component "BetQuotedFailure Types" {');
    runner.expect(result).toContain('enum QuoteStatus {');
    runner.expect(result).toContain('enum Platform {');
    
    // Check relationships aren't duplicated
    const relationshipLines = result.split('\n').filter(line => 
      line.includes('--') && (line.includes('--*') || line.includes('--o'))
    );
    const uniqueRelationships = [...new Set(relationshipLines)];
    runner.expect(relationshipLines.length).toBe(uniqueRelationships.length);
  });
});

// PlantUML Encoder Tests
runner.describe('PlantUML Encoder Tests', () => {
  runner.test('should generate valid URL', () => {
    const plantuml = '@startuml\nAlice -> Bob\n@enduml';
    const endpoint = 'https://www.plantuml.com/plantuml';
    
    const result = generatePlantUMLImageUrl(plantuml, endpoint);
    
    runner.expect(typeof result).toBe('string');
    runner.expect(result).toContain(endpoint);
    runner.expect(result.length).toBeGreaterThan(endpoint.length + 10);
    // Verify it's a valid URL format
    try {
      new URL(result);
      // If we get here, the URL is valid
    } catch (error) {
      throw new Error(`Generated URL '${result}' is not a valid URL: ${error.message}`);
    }
  });

  runner.test('should compress and encode', () => {
    const plantuml = '@startuml\nAlice -> Bob\n@enduml';
    
    const result = compressAndEncode(plantuml);
    
    runner.expect(typeof result).toBe('object');
    runner.expect(result.data).toBeTruthy();
    runner.expect(result.type).toBeTruthy();
    runner.expect(typeof result.data).toBe('string');
    runner.expect(result.data.length).toBeGreaterThan(0);
    runner.expect(['deflate', 'hex']).toContain(result.type);
  });

  runner.test('should handle errors correctly', () => {
    runner.expect(() => generatePlantUMLImageUrl(null, 'test')).toThrow();
    runner.expect(() => compressAndEncode(null)).toThrow();
  });
});

// Edge Cases Tests
runner.describe('Edge Cases Tests', () => {
  const lib = new Proto2Diagram();

  runner.test('should handle empty proto', () => {
    const proto = 'syntax = "proto3";';
    const result = lib.generatePlantUMLCode(proto);
    
    runner.expect(result).toContain('@startuml');
    runner.expect(result).toContain('@enduml');
  });

  runner.test('should handle nested messages', () => {
    const proto = `
      syntax = "proto3";
      message Outer {
        message Inner {
          string value = 1;
        }
        Inner inner = 1;
      }
    `;
    const result = lib.generatePlantUMLCode(proto);
    
    runner.expect(result).toContain('object Outer {');
    runner.expect(result).toContain('object Inner {');
    runner.expect(result).toContain('value : string');
    runner.expect(result).toContain('Outer --* "1" Inner');
  });

  runner.test('should handle map fields', () => {
    const proto = `
      syntax = "proto3";
      message Container {
        map<string, User> users = 1;
      }
      message User { string name = 1; }
    `;
    const result = lib.generatePlantUMLCode(proto);
    
    runner.expect(result).toContain('users : map<string, User>');
    runner.expect(result).toContain('Container --* "0..*" User');
  });

  runner.test('should handle services', () => {
    const proto = `
      syntax = "proto3";
      service UserService {
        rpc GetUser(UserRequest) returns (UserResponse);
      }
      message UserRequest { string id = 1; }
      message UserResponse { string name = 1; }
    `;
    const result = lib.generatePlantUMLCode(proto);
    
    runner.expect(result).toContain('control UserService {');
    runner.expect(result).toContain('GetUser(UserRequest) : UserResponse');
    runner.expect(result).toContain('UserService --> UserRequest');
    runner.expect(result).toContain('UserService --> UserResponse');
  });

  runner.test('should handle field name conversions', () => {
    const proto = `
      syntax = "proto3";
      message Test {
        string first_name = 1;
        string last_name_suffix = 2;
      }
    `;
    const result = lib.generatePlantUMLCode(proto);
    
    runner.expect(result).toContain('firstName : string');
    runner.expect(result).toContain('lastNameSuffix : string');
  });
});

// Run all tests
console.log('🚀 Running Proto2Diagram Library Test Suite');
console.log('🧪 Testing all components, features, and edge cases');
console.log('='.repeat(60));

const success = runner.summary();

if (success) {
  console.log('\n🎉 All tests passed! The library is working correctly.');
  process.exit(0);
} else {
  console.log('\n💥 Some tests failed. Please review the errors above.');
  process.exit(1);
}