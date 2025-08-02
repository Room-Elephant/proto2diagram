/**
 * Test setup and configuration
 */

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: process.env.NODE_ENV === 'test' && !process.env.VERBOSE_TESTS ? jest.fn() : console.log,
  debug: jest.fn(),
  info: console.info,
  warn: console.warn,
  error: console.error,
};

// Common test utilities
export const createMockProto = (options = {}) => {
  const {
    syntax = 'proto3',
    packageName = '',
    messages = [],
    enums = [],
    services = []
  } = options;

  let proto = `syntax = "${syntax}";\n`;
  
  if (packageName) {
    proto += `package ${packageName};\n`;
  }
  
  proto += '\n';
  
  messages.forEach(message => {
    proto += `message ${message.name} {\n`;
    if (message.fields) {
      message.fields.forEach((field, index) => {
        const optional = field.optional ? 'optional ' : '';
        const repeated = field.repeated ? 'repeated ' : '';
        proto += `  ${optional}${repeated}${field.type} ${field.name} = ${index + 1};\n`;
      });
    }
    proto += '}\n\n';
  });
  
  enums.forEach(enumDef => {
    proto += `enum ${enumDef.name} {\n`;
    if (enumDef.values) {
      enumDef.values.forEach((value, index) => {
        proto += `  ${value} = ${index};\n`;
      });
    }
    proto += '}\n\n';
  });
  
  services.forEach(service => {
    proto += `service ${service.name} {\n`;
    if (service.methods) {
      service.methods.forEach(method => {
        proto += `  rpc ${method.name}(${method.request}) returns (${method.response});\n`;
      });
    }
    proto += '}\n\n';
  });
  
  return proto.trim();
};

// Test matchers
expect.extend({
  toContainPlantUMLStructure(received) {
    const hasStart = received.includes('@startuml');
    const hasEnd = received.includes('@enduml');
    const hasPragma = received.includes('!pragma useIntermediatePackages false');
    
    const pass = hasStart && hasEnd && hasPragma;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to contain valid PlantUML structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to contain valid PlantUML structure (missing: ${!hasStart ? '@startuml' : !hasEnd ? '@enduml' : '!pragma'})`,
        pass: false,
      };
    }
  },
  
  toHaveUniqueRelationships(received) {
    const lines = received.split('\n');
    const relationshipLines = lines.filter(line => 
      line.includes('--') && (line.includes('--*') || line.includes('--o') || line.includes('-->'))
    );
    
    const uniqueRelationships = [...new Set(relationshipLines)];
    const pass = relationshipLines.length === uniqueRelationships.length;
    
    if (pass) {
      return {
        message: () => `expected ${received} to have duplicate relationships`,
        pass: true,
      };
    } else {
      const duplicates = relationshipLines.filter((line, index) => 
        relationshipLines.indexOf(line) !== index
      );
      return {
        message: () => `expected relationships to be unique, but found duplicates: ${duplicates.join(', ')}`,
        pass: false,
      };
    }
  },
  
  toHaveOptionalMarkers(received, fieldNames) {
    const pass = fieldNames.every(fieldName => 
      received.includes(`${fieldName} : `) && received.includes('?')
    );
    
    if (pass) {
      return {
        message: () => `expected ${received} not to have optional markers for ${fieldNames.join(', ')}`,
        pass: true,
      };
    } else {
      const missing = fieldNames.filter(fieldName => 
        !received.includes(`${fieldName} : `) || !received.includes('?')
      );
      return {
        message: () => `expected optional markers for ${missing.join(', ')}`,
        pass: false,
      };
    }
  }
});

// Setup test environment
beforeEach(() => {
  // Clear any caches or state between tests
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});