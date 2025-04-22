import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMedplumClient } from "./medplum/createMedplumClient.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  server.prompt(
    "schedule-appointment",
    "Prompt the user to schedule an intake appointment",
    {},
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Schedule an intake appointment.",
          },
        },
      ],
    })
  );
}
