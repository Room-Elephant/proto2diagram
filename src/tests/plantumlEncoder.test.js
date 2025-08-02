/**
 * Unit tests for PlantUML Encoder
 */

import { generatePlantUMLImageUrl, compressAndEncode } from "../plantumlEncoder.js";

describe("PlantUML Encoder", () => {
  describe("generatePlantUMLImageUrl", () => {
    test("should generate valid URL for simple PlantUML", () => {
      const plantuml = `
        @startuml
        Alice -> Bob: Hello
        @enduml
      `;
      const endpoint = "https://www.plantuml.com/plantuml";

      const result = generatePlantUMLImageUrl(plantuml, endpoint);

      expect(result).toContain(endpoint);
      expect(result.length).toBeGreaterThan(endpoint.length + 10);
      // Verify it's a valid URL format
      expect(() => new URL(result)).not.toThrow();
    });

    test("should generate different URLs for different content", () => {
      const plantuml1 = "@startuml\nAlice -> Bob\n@enduml";
      const plantuml2 = "@startuml\nBob -> Alice\n@enduml";
      const endpoint = "https://www.plantuml.com/plantuml";

      const result1 = generatePlantUMLImageUrl(plantuml1, endpoint);
      const result2 = generatePlantUMLImageUrl(plantuml2, endpoint);

      expect(result1).not.toBe(result2);
    });

    test("should handle custom endpoints", () => {
      const plantuml = "@startuml\nAlice -> Bob\n@enduml";
      const customEndpoint = "https://custom.plantuml.server/plantuml";

      const result = generatePlantUMLImageUrl(plantuml, customEndpoint);

      expect(result).toContain(customEndpoint);
    });

    test("should throw error for invalid parameters", () => {
      expect(() => {
        generatePlantUMLImageUrl(null, "https://example.com");
      }).toThrow();

      expect(() => {
        generatePlantUMLImageUrl("valid", null);
      }).toThrow();

      expect(() => {
        generatePlantUMLImageUrl("", "https://example.com");
      }).toThrow();

      expect(() => {
        generatePlantUMLImageUrl("valid", "");
      }).toThrow();
    });
  });

  describe("compressAndEncode", () => {
    test("should compress and encode PlantUML text", () => {
      const plantuml = `
        @startuml
        object User {
          name : string
          age : int32
        }
        @enduml
      `;

      const result = compressAndEncode(plantuml);

      expect(typeof result).toBe("object");
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("type");
      expect(typeof result.data).toBe("string");
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.length).toBeLessThan(plantuml.length); // Should be compressed
    });

    test("should produce consistent results for same input", () => {
      const plantuml = "@startuml\nAlice -> Bob\n@enduml";

      const result1 = compressAndEncode(plantuml);
      const result2 = compressAndEncode(plantuml);

      expect(result1).toBe(result2);
    });

    test("should produce different results for different input", () => {
      const plantuml1 = "@startuml\nAlice -> Bob\n@enduml";
      const plantuml2 = "@startuml\nBob -> Alice\n@enduml";

      const result1 = compressAndEncode(plantuml1);
      const result2 = compressAndEncode(plantuml2);

      expect(result1).not.toBe(result2);
    });

    test("should handle empty input", () => {
      expect(() => {
        compressAndEncode("");
      }).toThrow();
    });

    test("should handle null input", () => {
      expect(() => {
        compressAndEncode(null);
      }).toThrow();
    });

    test("should handle large PlantUML diagrams", () => {
      // Create a large PlantUML diagram
      const largePlantuml =
        "@startuml\n" +
        Array.from({ length: 100 }, (_, i) => `object User${i} { name : string }`).join("\n") +
        "\n@enduml";

      const result = compressAndEncode(largePlantuml);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThan(largePlantuml.length); // Should be compressed
    });

    test("should handle special characters", () => {
      const plantumlWithSpecialChars = `
        @startuml
        object "User-Name" {
          "field_with_underscores" : string
          "field with spaces" : string
          "field@with#symbols" : string
        }
        @enduml
      `;

      const result = compressAndEncode(plantumlWithSpecialChars);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("integration", () => {
    test("should work together for complete URL generation", () => {
      const plantuml = `
        @startuml
        !pragma useIntermediatePackages false
        package "com.example.test" {
          object User {
            name : string
            email : string?
            age : int32
          }
          object Address {
            street : string
            city : string
          }
          enum Status {
            ACTIVE
            INACTIVE
          }
        }
        User --* "0..1" Address
        User --o "1" Status
        @enduml
      `;
      const endpoint = "https://www.plantuml.com/plantuml";

      const url = generatePlantUMLImageUrl(plantuml, endpoint);

      expect(url).toContain(endpoint);

      // URL should be valid format
      expect(() => new URL(url)).not.toThrow();
    });

    test("should handle proto2diagram generated content", () => {
      // This is typical output from our proto2diagram library
      const protoGeneratedPlantuml = `
        @startuml
        !pragma useIntermediatePackages false
        package "com.flutter.gbp.fcq.quote.event" {
        object BetQuoted {
          betQuotedSuccessful : BetQuotedSuccessful?
          betQuotedFailure : BetQuotedFailure?
        }
        note right of BetQuoted
          Only one of betQuotedSuccessful or betQuotedFailure is set
        end note
        object BetQuotedSuccessful {
          betId : string
          appKey : string
          platform : Platform
          quote : double
          wealthMargin : double?
          remainingLegs : int32?
          accountId : string
        }
        object BetQuotedFailure {
          betId : string
          appKey : string
          platform : Platform
          quoteStatus : QuoteStatus
          remainingLegs : int32?
          accountId : string
        }
        enum BetQuotedFailure_QuoteStatus {
          UNKNOWN
          UNAVAILABLE
          BET_CLOSED
        }
        enum Platform {
          UNKNOWN
          ONLINE
          RETAIL
        }
        }
        BetQuoted --* "0..1" BetQuotedSuccessful
        BetQuoted --* "0..1" BetQuotedFailure
        BetQuotedSuccessful --o "1" Platform
        BetQuotedFailure --o "1" Platform
        BetQuotedFailure --o "1" BetQuotedFailure_QuoteStatus
        @enduml
      `;

      const url = generatePlantUMLImageUrl(protoGeneratedPlantuml, "https://www.plantuml.com/plantuml");

      expect(url).toContain("https://www.plantuml.com/plantuml");
      expect(() => new URL(url)).not.toThrow();
    });
  });
});
