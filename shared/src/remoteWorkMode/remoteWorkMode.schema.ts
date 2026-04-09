import z from "zod";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import {
  type RemoteWorkMode,
  remoteWorkModes,
  type WithOptionnalRemoteWorkModes,
  type WithRemoteWorkMode,
} from "./remoteWorkMode.dto";

export const remoteWorkModeSchema: ZodSchemaWithInputMatchingOutput<RemoteWorkMode> =
  z.enum(remoteWorkModes);
export const withRemoteWorkModeSchema: ZodSchemaWithInputMatchingOutput<WithRemoteWorkMode> =
  z.object({
    remoteWorkMode: remoteWorkModeSchema,
  });

export const withOptionnalRemoteWorkModesSchema: ZodSchemaWithInputMatchingOutput<WithOptionnalRemoteWorkModes> =
  z.object({
    remoteWorkModes: z.array(remoteWorkModeSchema).optional(),
  });
