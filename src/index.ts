import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { registerTools } from "./lib/tools.js";
import { registerPrompts } from "./lib/prompts.js";

const server = new McpServer({
  name: "Medplum Scheduling MCP",
  version: "1.0.0",
  instructions: `This MCP server exposes tools to support a Scheduling workflow with FHIR. 
  
  A scheduling workflow usually involves the following steps:
  1. Find a practitioner to schedule an appointment with. You can retrieve all available schedules to find all practitioners.
  2. Once you have a practitioner, you can retrieve all available slots for the Schedule of the practitioner.
  3. Once you have a slot, you can book an appointment for the slot.
  `,
});

registerPrompts(server);
registerTools(server);

// async function main() {
//   const transport = new StdioServerTransport();
//   await server.connect(transport);
//   console.error("Medplum Scheduling MCP Server running");
// }

// main().catch((error) => {
//   console.error("Fatal error in main():", error);
//   process.exit(1);
// });

const app = express();
app.use(express.json());

// Store transports for each session type
const transports = {
  sse: {} as Record<string, SSEServerTransport>,
};

// OpenAI only supports SSE
app.get("/sse", async (req, res) => {
  // Create SSE transport for legacy clients
  const transport = new SSEServerTransport("/messages", res);
  transports.sse[transport.sessionId] = transport;

  res.on("close", () => {
    delete transports.sse[transport.sessionId];
  });

  await server.connect(transport);
});

// Legacy message endpoint for older clients
app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.sse[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport found for sessionId");
  }
});

app.listen(3000);
