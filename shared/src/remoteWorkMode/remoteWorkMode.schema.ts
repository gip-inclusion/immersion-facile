import z from "zod";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import {
  type RemoteWorkMode,
  remoteWorkModes,
  type WithOptionalRemoteWorkModes,
  type WithRemoteWorkMode,
} from "./remoteWorkMode.dto";

export const remoteWorkModeSchema: ZodSchemaWithInputMatchingOutput<RemoteWorkMode> =
  z.enum(remoteWorkModes, "Veuillez choisir une modalité");

export const remoteWorkModeShape = {
  remoteWorkMode: remoteWorkModeSchema,
};

export const withRemoteWorkModeSchema: ZodSchemaWithInputMatchingOutput<WithRemoteWorkMode> =
  z.object(remoteWorkModeShape);

export const withOptionalRemoteWorkModesSchema: ZodSchemaWithInputMatchingOutput<WithOptionalRemoteWorkModes> =
  z.object({
    remoteWorkModes: z.array(remoteWorkModeSchema).optional(),
  });
