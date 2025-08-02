// Proto to Diagram Library - Main Interface
// Simple API: proto string in, diagram URL out

import { ProtoParser } from "./protoParser.js";
import { PlantUMLGenerator } from "./plantUMLGenerator.js";
import { generatePlantUMLImageUrl } from "./plantumlEncoder.js";
import { CONFIG } from "./config.js";

/**
 * Main library class for converting Protocol Buffer definitions to diagram URLs
 *
 * Usage:
 *   const lib = new Proto2Diagram();
 *   const imageUrl = await lib.generateDiagramUrl(protoString);
 */
export class Proto2Diagram {
  constructor(options = {}) {
    this.options = {
      plantumlEndpoint: options.plantumlEndpoint || CONFIG.PLANTUML_ENDPOINT,
      ...options,
    };

    // Initialize internal components
    this.protoParser = new ProtoParser();
    this.plantUMLGenerator = new PlantUMLGenerator(this.protoParser);
  }

  /**
   * Main method: converts proto string to diagram image URL
   *
   * @param {string} protoContent - Protocol Buffer definition as string
   * @param {Object} options - Optional generation options
   * @returns {Promise<Object>} Result object with imageUrl and plantumlCode
   * @throws {Error} If proto parsing or diagram generation fails
   */
  async generateDiagramUrl(protoContent, options = {}) {
    // Validate inputs
    if (options !== null && typeof options !== "object") {
      throw new Error("Options must be an object or null");
    }

    const validatedOptions = options || {};

    try {
      // Generate PlantUML code (handles all validation and parsing)
      const plantumlCode = this.generatePlantUMLCode(protoContent);

      // Validate PlantUML code was generated
      if (!plantumlCode || typeof plantumlCode !== "string") {
        throw new Error("Failed to generate valid PlantUML code");
      }

      // Determine endpoint
      const endpoint = validatedOptions.plantumlEndpoint || this.options.plantumlEndpoint;
      if (!endpoint || typeof endpoint !== "string") {
        throw new Error("PlantUML endpoint must be a valid URL string");
      }

      // Generate image URL
      const imageUrl = generatePlantUMLImageUrl(plantumlCode, endpoint);

      // Validate generated URL
      if (!imageUrl || typeof imageUrl !== "string") {
        throw new Error("Failed to generate valid image URL");
      }

      return {
        imageUrl,
        plantumlCode,
        success: true,
      };
    } catch (error) {
      throw new Error(`Failed to generate diagram: ${error.message}`);
    }
  }

  /**
   * Generate only PlantUML code without image URL
   *
   * @param {string} protoContent - Protocol Buffer definition as string
   * @returns {string} PlantUML code
   */
  generatePlantUMLCode(protoContent) {
    try {
      this.validateProtoContent(protoContent);

      const { root, packageName } = this.protoParser.parseProtoString(protoContent);

      return this.plantUMLGenerator.generateFromRoot(root, packageName);
    } catch (error) {
      throw new Error(`Failed to generate PlantUML code: ${error.message}`);
    }
  }

  /**
   * Validate proto file content from string
   *
   * @param {string} protoContent - Proto content to validate
   * @returns {boolean} true if valid
   * @throws {Error} If validation fails
   */
  validateProtoContent(protoContent) {
    // Type validation
    if (protoContent === null || protoContent === undefined) {
      throw new Error("Proto content cannot be null or undefined");
    }

    if (typeof protoContent !== "string") {
      throw new Error(`Proto content must be a string, received ${typeof protoContent}`);
    }

    // Content validation
    const trimmedContent = protoContent.trim();
    if (trimmedContent.length === 0) {
      throw new Error("Proto content cannot be empty or contain only whitespace");
    }

    // Basic proto syntax validation
    if (!this.isValidProtoSyntax(trimmedContent)) {
      throw new Error("Proto content does not appear to contain valid protobuf syntax");
    }

    return true;
  }

  /**
   * Basic proto syntax validation
   *
   * @param {string} content - Trimmed proto content
   * @returns {boolean} true if content appears to be valid proto syntax
   */
  isValidProtoSyntax(content) {
    // Check for basic proto keywords
    const protoKeywords = /\b(syntax|package|message|enum|service|rpc|import|option)\b/;
    const hasProtoKeywords = protoKeywords.test(content);

    // Check for suspicious characters that shouldn't be in proto files
    const suspiciousChars = /[<>{}]/;
    const hasOnlyBraces = suspiciousChars.test(content) && !/{[^}]*}/.test(content);

    // Must have proto keywords and not be just random brackets
    return hasProtoKeywords && !hasOnlyBraces;
  }

  /**
   * Get library configuration
   *
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.options };
  }

  /**
   * Update library configuration
   *
   * @param {Object} newOptions - Options to update
   * @throws {Error} If newOptions is invalid
   */
  updateConfig(newOptions) {
    if (!newOptions || typeof newOptions !== "object") {
      throw new Error("New options must be a valid object");
    }

    // Validate specific option types if they exist
    if (newOptions.plantumlEndpoint && typeof newOptions.plantumlEndpoint !== "string") {
      throw new Error("plantumlEndpoint must be a string");
    }

    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Static method to create and use library in one call
   *
   * @param {string} protoContent - Protocol Buffer definition
   * @param {Object} options - Library options
   * @returns {Promise<Object>} Result with imageUrl and plantumlCode
   * @throws {Error} If inputs are invalid or generation fails
   */
  static async generateDiagram(protoContent, options = {}) {
    // Validate inputs before creating instance
    if (options !== null && typeof options !== "object") {
      throw new Error("Options must be an object or null");
    }

    let lib;
    try {
      lib = new Proto2Diagram(options);
    } catch (error) {
      throw new Error(`Failed to create Proto2Diagram instance: ${error.message}`);
    }

    return await lib.generateDiagramUrl(protoContent);
  }
}

// Export individual components for advanced usage
export { ProtoParser } from "./protoParser.js";
export { PlantUMLGenerator } from "./plantUMLGenerator.js";
export { generatePlantUMLImageUrl } from "./plantumlEncoder.js";
export { CONFIG } from "./config.js";

// Default export for simple usage
export default Proto2Diagram;
