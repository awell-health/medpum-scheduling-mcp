import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createMedplumClient } from "./medplum/createMedplumClient.js";

export function registerTools(server: McpServer) {
  server.tool(
    "get-schedules",
    "Retrieve all schedules. A schedule defines the broader availability and context for a practitioner.",
    {},
    async () => {
      const medplum = await createMedplumClient();
      const schedule = await medplum.search("Schedule");

      return {
        content: [{ type: "text", text: JSON.stringify(schedule, null, 2) }],
      };
    }
  );
  server.tool(
    "get-schedule",
    "Retrieve a schedule using an ID. A schedule defines the broader availability and context for an individual or service.",
    {
      scheduleResourceId: z
        .string()
        .describe("The resource ID of the schedule"),
    },
    async ({ scheduleResourceId }) => {
      const medplum = await createMedplumClient();
      const schedule = await medplum.readResource(
        "Schedule",
        scheduleResourceId
      );

      return {
        content: [{ type: "text", text: JSON.stringify(schedule, null, 2) }],
      };
    }
  );
  server.tool(
    "get-available-slots",
    "Retrieve the available slot. A slot provides the granular, bookable units within a Schedule.",
    {
      scheduleResourceId: z
        .string()
        .describe(
          "Optional filter to only retrieve slots for a specific Schedule."
        ),
    },
    async ({ scheduleResourceId }) => {
      const medplum = await createMedplumClient();
      const slots = await medplum.search(
        "Slot",
        `schedule=Schedule/${scheduleResourceId}&status=free`
      );

      return {
        content: [{ type: "text", text: JSON.stringify(slots, null, 2) }],
      };
    }
  );
  server.tool(
    "book-appointment",
    "Book an appointment, which is the outcome of a scheduling process.",
    {
      slotResourceId: z
        .string()
        .describe(
          "The resource ID of the slot to reference for the appointment."
        ),
      start: z
        .string()
        .datetime()
        .describe("The start date and time of the slot."),
      end: z.string().datetime().describe("The end date and time of the slot."),
      practitionerId: z
        .string()
        .describe(
          "The resource ID of the practitioner who's a participant in the appointment."
        ),
    },
    async ({ slotResourceId, start, end, practitionerId }) => {
      const medplum = await createMedplumClient();
      const appointment = await medplum.createResource({
        resourceType: "Appointment",
        status: "booked",
        slot: [
          {
            reference: `Slot/${slotResourceId}`,
          },
        ],
        start: start,
        end: end,
        participant: [
          {
            actor: { reference: `Practitioner/${practitionerId}` },
            status: "accepted",
          },
        ],
      });

      // Also block the slot
      await medplum.patchResource("Slot", slotResourceId, [
        { op: "replace", path: "/status", value: "busy-unavailable" },
        {
          op: "add",
          path: "/comment",
          value: `Booked by appointment ${appointment.id}`,
        },
      ]);

      return {
        content: [{ type: "text", text: JSON.stringify(appointment, null, 2) }],
      };
    }
  );
  server.tool(
    "cancel-appointment",
    "Cancel an appointment",
    {
      appointmentResourceId: z
        .string()
        .describe("The resource ID of the appointment to cancel."),
    },
    async ({ appointmentResourceId }) => {
      const medplum = await createMedplumClient();
      const appointment = await medplum.patchResource(
        "Appointment",
        appointmentResourceId,
        [{ op: "replace", path: "/status", value: "cancelled" }]
      );

      const slotReference = appointment.slot?.[0]?.reference?.split("/")[1];

      if (slotReference) {
        await medplum.patchResource("Slot", slotReference, [
          { op: "replace", path: "/status", value: "free" },
        ]);
      }

      return {
        content: [{ type: "text", text: JSON.stringify(appointment, null, 2) }],
      };
    }
  );
  server.tool(
    "get-appointment",
    "Retrieve the details of an appointment",
    {
      appointmentResourceId: z
        .string()
        .describe("The resource ID of the appointment to retrieve."),
    },
    async ({ appointmentResourceId }) => {
      const medplum = await createMedplumClient();
      const appointment = await medplum.readResource(
        "Appointment",
        appointmentResourceId
      );

      return {
        content: [{ type: "text", text: JSON.stringify(appointment, null, 2) }],
      };
    }
  );
}
