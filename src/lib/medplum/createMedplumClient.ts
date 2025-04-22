import { MedplumClient } from "@medplum/core";
import { z } from "zod";

const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;

const MedplumSettingsSchema = z.object({
  MEDPLUM_CLIENT_ID: z.string(),
  MEDPLUM_CLIENT_SECRET: z.string(),
});

export const createMedplumClient = async () => {
  const medplumSettings = MedplumSettingsSchema.parse({
    MEDPLUM_CLIENT_ID,
    MEDPLUM_CLIENT_SECRET,
  });

  const medplum = new MedplumClient();

  await medplum.startClientLogin(
    medplumSettings.MEDPLUM_CLIENT_ID,
    medplumSettings.MEDPLUM_CLIENT_SECRET
  );

  return medplum;
};
