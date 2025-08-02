// PlantUML code generation module
import { CONFIG } from "./config.js";
import protobuf from 'protobufjs';

/**
 * PlantUML diagram generator for Protocol Buffer definitions.
 * Converts parsed protobuf objects into PlantUML object diagram syntax.
 * 
 * @class PlantUMLGenerator
 */
export class PlantUMLGenerator {
  /**
   * Creates a new PlantUML generator instance.
   * 
   * @param {Object} protoParser - The protocol buffer parser instance containing utility methods
   */
  constructor(protoParser) {
    this.parser = protoParser;
    this.lines = [];
    this.relations = [];
    this.relationSet = new Set(); // Track unique relationships to avoid duplicates
  }

  /**
   * Generate PlantUML code from parsed protobuf root namespace.
   * 
   * @param {protobuf.Root} root - The protobuf root namespace to process
   * @param {string} [packageName] - Optional package name to wrap content in namespace
   * @returns {string} Complete PlantUML diagram code with @startuml/@enduml tags
   * @throws {Error} When root is null/undefined or processing fails
   */
  generateFromRoot(root, packageName = null) {
    if (!root) {
      throw new Error("Root namespace is required for PlantUML generation");
    }

    this.lines = [
      "@startuml",
      "!pragma useIntermediatePackages false",
      "skinparam componentStyle rectangle"
    ];
    this.relations = [];
    this.relationSet = new Set(); // Reset unique relationships tracker

    try {
      // If package name is provided, determine if package organization is meaningful
      if (packageName && packageName.trim()) {
        const packageInfo = this.analyzePackageStructure(root, packageName);
        
        if (packageInfo.shouldUsePackage) {
          this.lines.push(`package "${packageInfo.displayName}" {`);
          // Process content in a flat manner to avoid nested package structure
          this.processNamespaceFlat(packageInfo.targetNamespace);
          this.lines.push("}");
        } else {
          // Flatten - no package block needed
          this.processNamespace(packageInfo.targetNamespace);
        }
      } else {
        this.processNamespace(root);
      }
    } catch (error) {
      throw new Error(`Failed to process protobuf namespace: ${error.message}`);
    }

    // Add all relations at the end
    this.lines.push(...this.relations);
    this.lines.push("@enduml");

    return this.lines.join("\n");
  }

  /**
   * Analyze package structure to determine optimal package organization.
   * Decides whether to use package blocks and what name to display.
   * 
   * @param {protobuf.Namespace} root - The root namespace
   * @param {string} packageName - The full package name
   * @returns {Object} Package analysis result with shouldUsePackage, displayName, and targetNamespace
   */
  analyzePackageStructure(root, packageName) {
    const targetNamespace = this.findContentNamespace(root);
    const packageParts = packageName.split('.');
    
    // Count content at different levels
    const contentLevels = this.countContentAtLevels(root);
    
    // Decision logic for package usage
    const shouldUsePackage = this.shouldUsePackageBlock(packageParts, contentLevels, targetNamespace);
    
    // Determine the best display name
    const displayName = this.getOptimalPackageName(packageParts, shouldUsePackage);
    
    return {
      shouldUsePackage,
      displayName,
      targetNamespace
    };
  }

  /**
   * Count how many levels in the hierarchy contain actual content.
   * 
   * @param {protobuf.Namespace} ns - The namespace to analyze
   * @returns {number} Number of levels with content
   */
  countContentAtLevels(ns) {
    let contentLevels = 0;
    
    const hasDirectContent = (namespace) => {
      if (!namespace.nested) return false;
      return Object.values(namespace.nested).some(value => 
        value instanceof protobuf.Type || 
        value instanceof protobuf.Enum || 
        value instanceof protobuf.Service
      );
    };
    
    const traverse = (namespace) => {
      if (hasDirectContent(namespace)) {
        contentLevels++;
      }
      
      if (namespace.nested) {
        Object.values(namespace.nested).forEach(value => {
          if (value && value.nested && !(value instanceof protobuf.Type)) {
            traverse(value);
          }
        });
      }
    };
    
    traverse(ns);
    return contentLevels;
  }

  /**
   * Determine if a package block adds meaningful organization.
   * 
   * @param {string[]} packageParts - Package name split by dots
   * @param {number} contentLevels - Number of levels with content
   * @param {protobuf.Namespace} targetNamespace - The namespace with content
   * @returns {boolean} Whether to use a package block
   */
  shouldUsePackageBlock(packageParts, contentLevels, targetNamespace) {
    // Use package if there are multiple content levels (organizational value)
    if (contentLevels > 1) {
      return true;
    }
    
    // For single content level, be more generous about showing packages
    const lastPart = packageParts[packageParts.length - 1];
    const meaningfulNames = ['api', 'service', 'event', 'model', 'dto', 'proto', 'message', 'client', 'server'];
    
    // Use package for meaningful names
    if (meaningfulNames.includes(lastPart.toLowerCase())) {
      return true;
    }
    
    // Also use package if it provides business/domain context (reasonable length)
    if (packageParts.length >= 3 && packageParts.length <= 6) {
      return true;
    }
    
    // Only flatten very simple packages or keep extremely long ones if they have meaningful structure
    if (packageParts.length <= 2) {
      return false; // Too simple, flatten
    }
    
    // For extremely long packages (>8 parts), flatten unless they have clear organizational value
    if (packageParts.length > 8) {
      return false; // Too complex, flatten
    }
    
    // Default: use package for reasonable length hierarchies
    return true;
  }

  /**
   * Get the optimal package name to display.
   * 
   * @param {string[]} packageParts - Package name split by dots
   * @param {boolean} shouldUsePackage - Whether package block will be used
   * @returns {string} The optimal package name to display
   */
  getOptimalPackageName(packageParts, shouldUsePackage) {
    if (!shouldUsePackage) {
      return ''; // Won't be used anyway
    }
    
    // For reasonable length packages (up to 6 parts), show the full name
    // This preserves business context like "com.flutter.gbp.fcq.quote.event"
    if (packageParts.length <= 6) {
      return packageParts.join('.');
    }
    
    // For very long packages, consider shortening to meaningful parts
    const lastPart = packageParts[packageParts.length - 1];
    const meaningfulNames = ['api', 'service', 'event', 'model', 'dto', 'proto', 'message'];
    
    if (meaningfulNames.includes(lastPart.toLowerCase())) {
      // Use last 3-4 parts for context
      const startIdx = Math.max(0, packageParts.length - 4);
      return packageParts.slice(startIdx).join('.');
    }
    
    // For extremely long packages, use a reasonable subset
    if (packageParts.length > 8) {
      // Show first part + ... + last 3 parts
      return `${packageParts[0]}...${packageParts.slice(-3).join('.')}`;
    }
    
    // Default: use full package name
    return packageParts.join('.');
  }

  /**
   * Find the deepest namespace that contains actual protobuf content (messages, enums, services).
   * This navigates through package hierarchies to find where the actual types are defined.
   * 
   * @param {protobuf.Namespace} ns - The namespace to search
   * @returns {protobuf.Namespace} The namespace containing the actual content
   */
  findContentNamespace(ns) {
    if (!ns || !ns.nested) {
      return ns;
    }

    // Check if this namespace has any actual protobuf types
    const hasTypes = Object.values(ns.nested).some(value => 
      value instanceof protobuf.Type || 
      value instanceof protobuf.Enum || 
      value instanceof protobuf.Service
    );

    if (hasTypes) {
      return ns; // This namespace has content, use it
    }

    // If no types here, look for content in nested namespaces
    for (const [key, value] of Object.entries(ns.nested)) {
      if (value && value.nested) {
        const found = this.findContentNamespace(value);
        if (found !== value) { // Found content deeper
          return found;
        }
      }
    }

    // If we reach here, return the current namespace as fallback
    return ns;
  }

  /**
   * Process namespace content in a flat manner, collecting all types from nested hierarchies.
   * This prevents PlantUML from creating nested package structures.
   * 
   * @param {protobuf.Namespace} ns - The namespace to process
   */
  processNamespaceFlat(ns) {
    // Collect all content from this namespace and any nested namespaces
    const allContent = this.collectAllContent(ns);
    
    // Process all collected content directly (flattened)
    allContent.messages.forEach(messageType => {
      this.processMessageType(messageType);
    });
    
    allContent.enums.forEach(enumType => {
      // For flat processing, don't use parent names for global enums
      this.processEnumType(enumType, "");
    });
    
    allContent.services.forEach(serviceType => {
      this.processServiceType(serviceType);
    });
  }

  /**
   * Recursively collect all content (messages, enums, services) from a namespace hierarchy.
   * 
   * @param {protobuf.Namespace} ns - The namespace to collect from
   * @returns {Object} Object with arrays of messages, enums, and services
   */
  collectAllContent(ns) {
    const content = {
      messages: [],
      enums: [],
      services: []
    };
    
    if (!ns || !ns.nested) {
      return content;
    }
    
    // Collect content from current namespace
    Object.values(ns.nested).forEach(value => {
      if (value instanceof protobuf.Type) {
        content.messages.push(value);
        // Note: nested enums within messages will be handled by processMessageType
      } else if (value instanceof protobuf.Enum) {
        // Only collect top-level enums, not nested ones within messages
        content.enums.push(value);
      } else if (value instanceof protobuf.Service) {
        content.services.push(value);
      } else if (value && value.nested) {
        // Recursively collect from nested namespaces (package hierarchies)
        const nestedContent = this.collectAllContent(value);
        content.messages.push(...nestedContent.messages);
        content.enums.push(...nestedContent.enums);
        content.services.push(...nestedContent.services);
      }
    });
    
    return content;
  }

  /**
   * Process protobuf namespace recursively, handling messages, enums, and services.
   * 
   * @param {protobuf.Namespace} ns - The namespace object to process
   * @param {string} [parentName=""] - Optional parent namespace name for nested types
   * @throws {Error} When namespace is invalid or processing a child element fails
   */
  processNamespace(ns, parentName = "") {
    if (!ns || typeof ns !== 'object') {
      throw new Error("Invalid namespace object provided");
    }

    const nested = ns.nested || {};
    for (const [key, value] of Object.entries(nested)) {
      try {
        if (value instanceof protobuf.Type) {
          this.processMessageType(value);
        } else if (value instanceof protobuf.Enum) {
          this.processEnumType(value, parentName);
        } else if (value instanceof protobuf.Service) {
          this.processServiceType(value);
        } else if (value && value.nested) {
          this.processNamespace(value, parentName);
        }
      } catch (error) {
        throw new Error(`Failed to process ${key}: ${error.message}`);
      }
    }
  }

  /**
   * Process a protobuf message type and convert it to PlantUML object notation.
   * 
   * @param {protobuf.Type} messageType - The message type to process
   * @throws {Error} When message type is invalid or field processing fails
   */
  processMessageType(messageType) {
    if (!messageType || !messageType.name) {
      throw new Error("Message type must have a valid name");
    }

    // Check if this message has nested types (enums)
    const hasNestedTypes = messageType.nested && 
      Object.values(messageType.nested).some(value => value instanceof protobuf.Enum);

    if (hasNestedTypes) {
      // Wrap in component for messages with nested types
      this.lines.push(`component "${messageType.name} Types" {`);
    }

    this.lines.push(`object ${messageType.name} {`);

    // Process fields including oneofs (skip reserved fields)
    const fields = messageType.fieldsArray || [];
    fields
      .filter((field) => field && !field.reserved)
      .forEach((field) => {
        try {
          this.processMessageField(field, messageType.name);
        } catch (error) {
          throw new Error(`Failed to process field in ${messageType.name}: ${error.message}`);
        }
      });

    this.lines.push("}");

    // Add notes for oneof groups to clarify mutual exclusivity
    this.processOneofNotes(messageType);

    // Process nested enums within this message (without parent name prefix)
    if (messageType.nested) {
      this.processNamespace(messageType, "");
    }

    if (hasNestedTypes) {
      // Close component
      this.lines.push("}");
    }
  }

  /**
   * Process a single field within a message and add it to the PlantUML output.
   * 
   * @param {protobuf.Field} field - The field to process
   * @param {string} parentTypeName - The name of the parent message type
   */
  processMessageField(field, parentTypeName) {
    const fieldType = this.parser.extractFieldType(field, parentTypeName);
    let displayType = fieldType;

    // Handle map display
    if (field.map) {
      displayType = `map<${field.keyType || "string"}, ${fieldType}>`;
    }

    // Add repeated marker for repeated fields
    if (field.repeated && !field.map) {
      displayType = `${displayType} [ ]`;
    }

    // Add optional marker for optional fields
    if (this.parser.isOptionalField(field)) {
      displayType = `${displayType} ?`;
    }

    // Use camelCase for field names
    const fieldName = this.parser.toCamelCase(field.name);
    this.lines.push(`  ${fieldName} : ${displayType}`);

    // Create relationships (skip well-known types)
    if (!this.parser.isWellKnownType(fieldType)) {
      this.createRelationship(field, fieldType, parentTypeName);
    }
  }

  /**
   * Process oneof groups and add explanatory notes to clarify mutual exclusivity.
   * 
   * @param {protobuf.Type} messageType - The message type to process for oneof groups
   */
  processOneofNotes(messageType) {
    if (!messageType.oneofs || Object.keys(messageType.oneofs).length === 0) {
      return; // No oneof groups in this message
    }

    Object.entries(messageType.oneofs).forEach(([oneofName, oneof]) => {
      if (oneof.fieldsArray && oneof.fieldsArray.length > 1) {
        const fieldNames = oneof.fieldsArray
          .map(field => this.parser.toCamelCase(field.name))
          .join(' or ');
        
        this.lines.push(`note right of ${messageType.name}`);
        this.lines.push(`  Only one of ${fieldNames} is set`);
        this.lines.push(`end note`);
      }
    });
  }

  /**
   * Create a relationship between types for PlantUML diagram connections.
   * Avoids duplicate relationships when multiple fields reference the same type.
   * 
   * @param {protobuf.Field} field - The field that creates the relationship
   * @param {string} fieldType - The type of the field
   * @param {string} parentTypeName - The name of the parent type
   */
  createRelationship(field, fieldType, parentTypeName) {
    const resolvedType = this.parser.resolveTypeName(fieldType, parentTypeName);

    if (this.parser.knownTypes.has(resolvedType)) {
      const cardinality = this.parser.getCardinality(field);
      const relationshipType = this.parser.getRelationshipType(resolvedType);

      const relationshipString = `${parentTypeName} ${relationshipType} ${cardinality} ${resolvedType}`;
      
      // Only add if this exact relationship doesn't already exist
      if (!this.relationSet.has(relationshipString)) {
        this.relationSet.add(relationshipString);
        this.relations.push(relationshipString);
      }
    }
  }

  /**
   * Process a protobuf enum type and convert it to PlantUML enum notation.
   * 
   * @param {protobuf.Enum} enumType - The enum type to process
   * @param {string} parentName - Optional parent name for nested enums (kept for backward compatibility)
   * @throws {Error} When enum type is invalid or has no valid values
   */
  processEnumType(enumType, parentName) {
    if (!enumType || !enumType.name) {
      throw new Error("Enum type must have a valid name");
    }

    if (!enumType.values || typeof enumType.values !== 'object') {
      throw new Error(`Enum ${enumType.name} must have valid values`);
    }

    // Use the original enum name without prefixing when inside components
    const enumName = enumType.name;
    this.lines.push(`enum ${enumName} {`);

    Object.keys(enumType.values).forEach((enumValue) => {
      if (enumValue && typeof enumValue === 'string') {
        this.lines.push(`  ${enumValue}`);
      }
    });

    this.lines.push("}");
  }

  /**
   * Process a protobuf service type and convert it to PlantUML control notation.
   * 
   * @param {protobuf.Service} serviceType - The service type to process
   * @throws {Error} When service type is invalid, has no valid methods, or method processing fails
   */
  processServiceType(serviceType) {
    if (!serviceType || !serviceType.name) {
      throw new Error("Service type must have a valid name");
    }

    if (!serviceType.methods || typeof serviceType.methods !== 'object') {
      throw new Error(`stereotype ${serviceType.name} must have valid methods`);
    }

    this.lines.push(`stereotype ${serviceType.name} {`);

    Object.values(serviceType.methods).forEach((method) => {
      if (!method || !method.name) {
        throw new Error(`Invalid method in service ${serviceType.name}`);
      }

      const requestType = method.requestType || 'Unknown';
      const responseType = method.responseType || 'Unknown';
      
      this.lines.push(`  ${method.name}(${requestType}) : ${responseType}`);

      // Add service relationships (avoiding duplicates)
      const requestRelation = `${serviceType.name} ${CONFIG.UML.RELATIONSHIPS.ASSOCIATION} ${requestType}`;
      const responseRelation = `${serviceType.name} ${CONFIG.UML.RELATIONSHIPS.ASSOCIATION} ${responseType}`;
      
      if (!this.relationSet.has(requestRelation)) {
        this.relationSet.add(requestRelation);
        this.relations.push(requestRelation);
      }
      
      if (!this.relationSet.has(responseRelation)) {
        this.relationSet.add(responseRelation);
        this.relations.push(responseRelation);
      }
    });

    this.lines.push("}");
  }
}
