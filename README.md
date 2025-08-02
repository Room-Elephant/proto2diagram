# Proto to Diagram Library

A standalone JavaScript library for converting Protocol Buffer definitions to PlantUML diagrams.

## 🚀 Quick Start

```javascript
import { Proto2Diagram } from './lib/index.js';

// Simple usage - one line conversion
const protoString = `
syntax = "proto3";
message User {
  string name = 1;
  int32 age = 2;
}
`;

const lib = new Proto2Diagram();
const result = await lib.generateDiagramUrl(protoString);

console.log('Image URL:', result.imageUrl);
console.log('PlantUML Code:', result.plantumlCode);
```

## 📋 API Reference

### Main Class: `Proto2Diagram`

#### Constructor
```javascript
new Proto2Diagram(options)
```

**Options:**
- `plantumlEndpoint`: PlantUML server endpoint (default: "http://www.plantuml.com/plantuml/img/")

#### Methods

##### `generateDiagramUrl(protoContent, options)`
Converts proto string to diagram image URL.

**Parameters:**
- `protoContent` (string): Protocol Buffer definition
- `options` (object, optional): Generation options

**Returns:** Promise<Object>
```javascript
{
  imageUrl: "https://...",
  plantumlCode: "@startuml...",
  success: true
}
```

##### `generatePlantUMLCode(protoContent)`
Generates only PlantUML code without image URL.

**Returns:** Promise<string> - PlantUML code

##### `validateProtoContent(protoContent)`
Validates proto content.

**Returns:** boolean - true if valid

#### Static Methods

##### `Proto2Diagram.generateDiagram(protoContent, options)`
One-shot method to generate diagram without creating instance.

```javascript
const result = await Proto2Diagram.generateDiagram(protoString);
```

## 📦 Individual Exports

For advanced usage, you can import individual components:

```javascript
import { 
  ProtoParser,
  PlantUMLGenerator,
  generatePlantUMLImageUrl,
  CONFIG 
} from './lib/index.js';
```

## 🎯 Use Cases

### 1. Simple Web Application
```javascript
import Proto2Diagram from './lib/index.js';

const lib = new Proto2Diagram();
document.getElementById('convert').onclick = async () => {
  const proto = document.getElementById('proto').value;
  const result = await lib.generateDiagramUrl(proto);
  document.getElementById('diagram').src = result.imageUrl;
};
```

### 2. Custom PlantUML Server
```javascript
const lib = new Proto2Diagram({
  plantumlEndpoint: 'https://your-plantuml-server.com/img/'
});
```

### 3. Validation Only
```javascript
const lib = new Proto2Diagram();
try {
  lib.validateProtoContent(protoString);
  console.log('Valid proto!');
} catch (error) {
  console.log('Invalid:', error.message);
}
```

## ⚙️ Configuration

Default configuration can be accessed via:

```javascript
import { CONFIG } from './lib/index.js';
console.log(CONFIG.PLANTUML_ENDPOINT);
```

## 🔧 Error Handling

The library throws descriptive errors:

```javascript
try {
  const result = await lib.generateDiagramUrl(invalidProto);
} catch (error) {
  console.error('Generation failed:', error.message);
  // Possible errors:
  // - "Proto content must be a non-empty string"
  // - "Proto content too large. Maximum size is 10MB"
  // - "Failed to generate diagram: [specific error]"
}
```

## 📄 Dependencies

- `protobufjs`: ^7.5.3 - Protocol Buffer parsing
- `pako`: ^2.1.0 - Compression for PlantUML encoding

## 📋 License

ISC