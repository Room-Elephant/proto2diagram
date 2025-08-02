// Example usage of the Proto to Diagram Library

import { Proto2Diagram } from "../src/index.js";

// Sample proto definition
const sampleProto = `
syntax = "proto3";

package com.roomelephant;

message User {
  string name = 1;
  optional int32 age = 2;
  Status status = 3;
  repeated string emails = 4;
  Address address = 5;

  enum Status {
    UNKNOWN = 0;
    ACTIVE = 1;
    INACTIVE = 2;
  }
}

message Address {
  string street = 1;
  string city = 2;
  string country = 3;
}

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc UpdateUser(UpdateUserRequest) returns (User);
}

message GetUserRequest {
  string user_id = 1;
}

message UpdateUserRequest {
  string user_id = 1;
  User user = 2;
}
`;

async function demonstrateLibrary() {
  console.log("🚀 Proto to Diagram Library Demo\n");

  try {
    // Example 1: Basic usage
    console.log("📋 Example 1: Basic Diagram Generation");
    const lib = new Proto2Diagram();
    const result = await lib.generateDiagramUrl(sampleProto);

    console.log("✅ Success!");
    console.log("📷 Image URL:", result.imageUrl);
    console.log("📝 PlantUML Code Length:", result.plantumlCode.length, "characters");
    console.log("");

    // Example 2: Static method
    console.log("📋 Example 2: Static Method Usage");
    const staticResult = await Proto2Diagram.generateDiagram(sampleProto);
    console.log("✅ Static method success!");
    console.log("📷 URLs match:", result.imageUrl === staticResult.imageUrl);
    console.log("");

    // Example 3: PlantUML code only
    console.log("📋 Example 3: PlantUML Code Only");
    const plantumlCode = await lib.generatePlantUMLCode(sampleProto);
    console.log("📝 Generated PlantUML:");
    console.log(plantumlCode);
    console.log("");

    // Example 4: Validation
    console.log("📋 Example 4: Content Validation");
    const isValid = lib.validateProtoContent(sampleProto);
    console.log("✅ Proto is valid:", isValid);

    // Test invalid content
    try {
      lib.validateProtoContent("");
    } catch (error) {
      console.log("❌ Empty content error:", error.message);
    }
    console.log("");

    // Example 5: Custom configuration
    console.log("📋 Example 5: Custom Configuration");
    const customLib = new Proto2Diagram({
      plantumlEndpoint: "https://www.plantuml.com/plantuml/svg/",
    });

    console.log("⚙️  Custom config:", customLib.getConfig());
    console.log("");

    // Example 6: Error handling
    console.log("📋 Example 6: Error Handling");
    try {
      await lib.generateDiagramUrl("invalid proto content {{{");
    } catch (error) {
      console.log("❌ Expected error caught:", error.message.substring(0, 50) + "...");
    }

    console.log("\n🎉 All examples completed successfully!");
  } catch (error) {
    console.error("💥 Demo failed:", error.message);
  }
}

// Run the demo
demonstrateLibrary();
