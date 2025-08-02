// Example usage of the Proto to Diagram Library

import { Proto2Diagram } from "../src/index.js";
import { readFileSync } from "fs";

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const protoPath = join(__dirname, 'quote.proto');
const sampleProto = readFileSync(protoPath, 'utf8');

async function demonstrateLibrary() {
  console.log("🚀 Proto to Diagram Library Demo\n");

  try {
    // Example 1: Basic usage
    console.log("📋 Example 1: Basic Diagram Generation");
    const lib = new Proto2Diagram();
    const result = await lib.generateDiagramUrl(sampleProto);

    console.log("✅ Success!");
    console.log("📷 Image URL:", result.imageUrl);
    console.log("📝 PlantUML Code", result.plantumlCode);
    console.log("");
  } catch (error) {
    console.error("💥 Demo failed:", error.message);
  }
}

// Run the demo
demonstrateLibrary();
