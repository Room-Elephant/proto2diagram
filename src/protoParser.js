// Protobuf parsing module
import { CONFIG } from "./config.js";
import protobuf from "protobufjs";

export class ProtoParser {
  constructor() {
    this.knownTypes = new Set();
    this.knownEnumTypes = new Set();
  }

  // First pass: collect all type and enum names
  collectTypes(ns, parentName = "") {
    if (!ns || typeof ns !== "object") {
      return; // Gracefully handle invalid namespace
    }

    const nested = ns.nested || {};
    for (const [key, value] of Object.entries(nested)) {
      if (!value) {
        continue; // Skip null/undefined values
      }

      try {
        if (value instanceof protobuf.Type) {
          this.collectMessageType(value, key);
        } else if (value instanceof protobuf.Enum) {
          this.collectEnumType(value, parentName, key);
        } else if (value.nested) {
          this.collectTypes(value, parentName);
        }
      } catch (error) {
        throw new Error(`Failed to collect types from '${key}': ${error.message}`);
      }
    }
  }

  // Helper method to collect message types
  collectMessageType(messageType, key) {
    if (!messageType.name) {
      throw new Error(`Type at key '${key}' has no name`);
    }

    this.knownTypes.add(messageType.name);

    // Recursively collect nested types within this message
    if (messageType.nested) {
      this.collectTypes(messageType, messageType.name);
    }
  }

  // Helper method to collect enum types
  collectEnumType(enumType, parentName, key) {
    if (!enumType.name) {
      throw new Error(`Enum at key '${key}' has no name`);
    }

    // Store both the original name and the prefixed name for compatibility
    const originalName = enumType.name;
    const prefixedName = this.generateEnumName(enumType.name, parentName);

    // Add both names to known types to support both approaches
    this.knownTypes.add(originalName);
    this.knownEnumTypes.add(originalName);

    // Also add prefixed name for backward compatibility with existing relationships
    if (parentName) {
      this.knownTypes.add(prefixedName);
      this.knownEnumTypes.add(prefixedName);
    }
  }

  // Helper method to generate enum names consistently
  generateEnumName(enumName, parentName) {
    return parentName ? `${parentName}_${enumName}` : enumName;
  }

  // Helper function to extract type from map or repeated fields
  extractFieldType(field, parentTypeName) {
    if (!field) {
      throw new Error("Field cannot be null or undefined");
    }

    if (!field.type) {
      throw new Error(`Field ${field.name || "unknown"} has no type defined`);
    }

    // For maps, field.type is the value type
    return field.type;
  }

  // Helper function to check if a type is a well-known Google protobuf type
  isWellKnownType(fieldType) {
    return fieldType && fieldType.startsWith(CONFIG.WELL_KNOWN_TYPE_PREFIX);
  }

  // Helper function to convert snake_case to camelCase
  toCamelCase(str) {
    if (!str || typeof str !== "string") {
      return str;
    }
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  // Helper function to resolve the actual type name for relationships
  resolveTypeName(fieldType, parentTypeName) {
    if (!fieldType || typeof fieldType !== "string") {
      throw new Error("Field type must be a non-empty string");
    }

    // First check if the original field type exists (component approach)
    if (this.knownTypes.has(fieldType)) {
      return fieldType;
    }

    // For backward compatibility, check if this might be a nested enum with the parent prefix
    if (parentTypeName && typeof parentTypeName === "string") {
      const nestedEnumName = `${parentTypeName}_${fieldType}`;
      if (this.knownTypes.has(nestedEnumName)) {
        return nestedEnumName;
      }
    }

    // Otherwise, use the original fieldType
    return fieldType;
  }

  // Determine cardinality for a field
  getCardinality(field) {
    if (!field) {
      return CONFIG.UML.CARDINALITY.REQUIRED;
    }

    // Multiple cardinality for maps and repeated fields
    if (field.map || field.repeated) {
      return CONFIG.UML.CARDINALITY.MULTIPLE;
    }

    // Optional cardinality for optional fields and oneof fields
    if (this.isOptionalField(field)) {
      return CONFIG.UML.CARDINALITY.OPTIONAL;
    }

    // Default to required for regular fields in proto3
    return CONFIG.UML.CARDINALITY.REQUIRED;
  }

  // Helper method to determine if a field is optional
  isOptionalField(field) {
    return field.rule === "optional" || field.partOf;
  }

  // Determine relationship type based on field type
  getRelationshipType(resolvedType) {
    if (!resolvedType || typeof resolvedType !== "string") {
      return CONFIG.UML.RELATIONSHIPS.COMPOSITION; // Default fallback
    }

    // Enums (nested or global) = Aggregation (reference/classification)
    if (this.knownEnumTypes.has(resolvedType)) {
      return CONFIG.UML.RELATIONSHIPS.COMPOSITION;
    }

    // Message types = Composition (ownership/containment)
    return CONFIG.UML.RELATIONSHIPS.AGGREGATION;
  }

  // Parse protobuf content and return structured data
  parseProtoString(content) {
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      throw new Error("Proto content must be a non-empty string");
    }

    let parsed;
    try {
      parsed = protobuf.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse protobuf content: ${error.message}`);
    }

    const root = parsed.root;
    if (!root) {
      throw new Error("Parsed protobuf has no root namespace");
    }

    // Reset known types for new parsing
    this.knownTypes.clear();
    this.knownEnumTypes.clear();

    try {
      // Collect all types first
      this.collectTypes(root);
    } catch (error) {
      throw new Error(`Failed to collect protobuf types: ${error.message}`);
    }

    return {
      root,
      knownTypes: this.knownTypes,
      packageName: parsed.package || null,
    };
  }

  // Legacy method for backward compatibility with file uploads
  async parseProtoFile(file) {
    if (!file) {
      throw new Error("File object cannot be null or undefined");
    }

    if (typeof file.text !== "function") {
      throw new Error("File object must have a text() method");
    }

    let content;
    try {
      content = await file.text();
    } catch (error) {
      throw new Error(`Failed to read file content: ${error.message}`);
    }

    return this.parseProtoString(content);
  }
}
