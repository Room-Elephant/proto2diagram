/**
 * Integration tests for the main Proto2Diagram library
 */

import { Proto2Diagram } from '../index.js';

describe('Proto2Diagram Integration', () => {
  let lib;

  beforeEach(() => {
    lib = new Proto2Diagram();
  });

  describe('constructor', () => {
    test('should create instance with default options', () => {
      const instance = new Proto2Diagram();
      expect(instance).toBeInstanceOf(Proto2Diagram);
      expect(instance.options).toHaveProperty('plantumlEndpoint');
    });

    test('should create instance with custom options', () => {
      const customEndpoint = 'https://custom.plantuml.server';
      const instance = new Proto2Diagram({
        plantumlEndpoint: customEndpoint
      });
      
      expect(instance.options.plantumlEndpoint).toBe(customEndpoint);
    });
  });

  describe('generatePlantUMLCode', () => {
    test('should generate PlantUML for simple message', () => {
      const proto = `
        syntax = "proto3";
        message User {
          string name = 1;
          int32 age = 2;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain('@startuml');
      expect(result).toContain('@enduml');
      expect(result).toContain('object User {');
      expect(result).toContain('name : string');
      expect(result).toContain('age : int32');
    });

    test('should handle package correctly', () => {
      const proto = `
        syntax = "proto3";
        package com.example.api;
        message User {
          string name = 1;
        }
      `;

      const result = lib.generatePlantUMLCode(proto);

      expect(result).toContain('package "com.example.api" {');
      expect(result).toContain('object User {');
    });

    test('should throw error for invalid proto', () => {
      const invalidProto = 'invalid proto syntax';
      
      expect(() => {
        lib.generatePlantUMLCode(invalidProto);
      }).toThrow('Failed to generate PlantUML code');
    });

    test('should validate input parameters', () => {
      expect(() => {
        lib.generatePlantUMLCode(null);
      }).toThrow('Failed to generate PlantUML code');

      expect(() => {
        lib.generatePlantUMLCode(undefined);
      }).toThrow('Failed to generate PlantUML code');

      expect(() => {
        lib.generatePlantUMLCode('');
      }).toThrow('Failed to generate PlantUML code');
    });
  });

  describe('generateDiagramUrl', () => {
    test('should generate diagram URL with PlantUML code', async () => {
      const proto = `
        syntax = "proto3";
        message User {
          string name = 1;
        }
      `;

      const result = await lib.generateDiagramUrl(proto);

      expect(result).toHaveProperty('imageUrl');
      expect(result).toHaveProperty('plantumlCode');
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(typeof result.imageUrl).toBe('string');
      expect(result.imageUrl).toContain('http');
      expect(result.plantumlCode).toContain('@startuml');
    });

    test('should handle custom endpoint', async () => {
      const customEndpoint = 'https://custom.plantuml.server';
      const proto = `
        syntax = "proto3";
        message User { string name = 1; }
      `;

      const result = await lib.generateDiagramUrl(proto, {
        plantumlEndpoint: customEndpoint
      });

      expect(result.imageUrl).toContain(customEndpoint);
    });

    test('should throw error for invalid options', async () => {
      const proto = `syntax = "proto3"; message User { string name = 1; }`;
      
      await expect(lib.generateDiagramUrl(proto, "invalid")).rejects.toThrow('Options must be an object or null');
    });

    test('should throw error for invalid endpoint', async () => {
      const proto = `syntax = "proto3"; message User { string name = 1; }`;
      
      await expect(lib.generateDiagramUrl(proto, { 
        plantumlEndpoint: null 
      })).rejects.toThrow('PlantUML endpoint must be a valid URL string');
    });
  });

  describe('comprehensive feature integration', () => {
    test('should handle complex proto with all features', () => {
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
          string appKey = 2;
          Platform platform = 3;
          double quote = 4;
          map<string, LegFeatures> legFeatureMapping = 5;
          string uuid = 6;
          optional double wealthMargin = 7;
          optional int32 remainingLegs = 8;
          string accountId = 9;
        }

        message BetQuotedFailure {
          string betId = 1;
          string appKey = 2;
          Platform platform = 3;
          enum QuoteStatus {
            UNKNOWN = 0;
            UNAVAILABLE = 1;
            BET_CLOSED = 2;
          }
          QuoteStatus quoteStatus = 4;
          map<string, LegFeatures> legFeatureMapping = 5;
          string uuid = 6;
          optional int32 remainingLegs = 7;
          string accountId = 8;
        }

        enum Platform {
          UNKNOWN = 0;
          ONLINE = 1;
          RETAIL = 2;
        }

        message LegFeatures {
          enum PricingStrategy {
            UNKNOWN_PRICING_STRATEGY = 0;
            SPORTSBOOK = 1;
            EXCHANGE = 2;
          }
          PricingStrategy pricingStrategyWin = 1;
          PricingStrategy pricingStrategyEW = 2;
          optional bool isInplay = 3;
          optional double tradeOutPrice = 4;
        }
      `;

      const result = lib.generatePlantUMLCode(complexProto);

      // Check all major features are present
      expect(result).toContain('!pragma useIntermediatePackages false');
      expect(result).toContain('skinparam componentStyle rectangle');
      expect(result).toContain('package "com.flutter.gbp.fcq.quote.event" {');
      
      // Check oneof notes
      expect(result).toContain('note right of BetQuoted');
      expect(result).toContain('Only one of betQuotedSuccessful or betQuotedFailure is set');
      
      // Check optional markers
      expect(result).toContain('wealthMargin : double ?');
      expect(result).toContain('remainingLegs : int32 ?');
      expect(result).toContain('isInplay : bool ?');
      expect(result).toContain('tradeOutPrice : double ?');
      
      // Check map handling
      expect(result).toContain('legFeatureMapping : map<string, LegFeatures>');
      
      // Check nested enums
      expect(result).toContain('enum BetQuotedFailure_QuoteStatus {');
      expect(result).toContain('enum LegFeatures_PricingStrategy {');
      
      // Check relationships (should not be duplicated)
      const relationshipLines = result.split('\n').filter(line => 
        line.includes('--') && (line.includes('--*') || line.includes('--o'))
      );
      
      // Verify no duplicate relationships to LegFeatures_PricingStrategy
      const pricingStrategyRelations = relationshipLines.filter(line => 
        line.includes('LegFeatures_PricingStrategy')
      );
      expect(pricingStrategyRelations).toHaveLength(1);
      
      // Verify package closing
      expect(result).toContain('}\n@enduml');
    });

    test('should handle services integration', () => {
      const serviceProto = `
        syntax = "proto3";
        package com.example.service;
        
        service UserService {
          rpc GetUser(GetUserRequest) returns (GetUserResponse);
          rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
          rpc UpdateUser(UpdateUserRequest) returns (UpdateUserResponse);
        }
        
        message GetUserRequest {
          string id = 1;
        }
        
        message GetUserResponse {
          User user = 1;
          bool found = 2;
        }
        
        message CreateUserRequest {
          string name = 1;
          optional string email = 2;
        }
        
        message CreateUserResponse {
          User user = 1;
          Status status = 2;
        }
        
        message UpdateUserRequest {
          string id = 1;
          User user = 2;
        }
        
        message UpdateUserResponse {
          bool success = 1;
        }
        
        message User {
          string id = 1;
          string name = 2;
          optional string email = 3;
          Status status = 4;
        }
        
        enum Status {
          UNKNOWN = 0;
          ACTIVE = 1;
          INACTIVE = 2;
        }
      `;

      const result = lib.generatePlantUMLCode(serviceProto);

      // Check service generation
      expect(result).toContain('control UserService {');
      expect(result).toContain('GetUser(GetUserRequest) : GetUserResponse');
      expect(result).toContain('CreateUser(CreateUserRequest) : CreateUserResponse');
      expect(result).toContain('UpdateUser(UpdateUserRequest) : UpdateUserResponse');
      
      // Check service relationships (should not be duplicated)
      const serviceRelations = result.split('\n').filter(line => 
        line.includes('UserService -->')
      );
      
      // Should have unique relationships to each request/response type
      expect(serviceRelations.length).toBeGreaterThan(0);
      
      // Check that User relationships are not duplicated despite multiple references
      const userRelations = result.split('\n').filter(line => 
        line.includes('--*') && line.includes('User') && !line.includes('UserService')
      );
      
      // Should have unique relationships
      const uniqueUserRelations = [...new Set(userRelations)];
      expect(userRelations).toEqual(uniqueUserRelations);
    });
  });

  describe('error handling', () => {
    test('should handle malformed proto gracefully', () => {
      const malformedProtos = [
        'syntax = "proto3"; message {',
        'syntax = "proto3"; message User { string = 1; }',
        'syntax = "proto3"; message User { invalid_type field = 1; }',
        '',
        '   ',
        'not proto at all'
      ];

      malformedProtos.forEach(proto => {
        expect(() => {
          lib.generatePlantUMLCode(proto);
        }).toThrow();
      });
    });

    test('should provide meaningful error messages', () => {
      expect(() => {
        lib.generatePlantUMLCode('invalid proto');
      }).toThrow(/Failed to generate PlantUML code/);
    });
  });
});