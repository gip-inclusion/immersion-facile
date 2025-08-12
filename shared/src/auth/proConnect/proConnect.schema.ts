import z from "zod";
import { siretSchema } from "../../siret/siret.schema";
import {
  type ZodSchemaWithInputMatchingOutput,
  zStringCanBeEmpty,
} from "../../zodUtils";
import type { ProConnectInfos } from "./proConnect.dto";

export const proConnectInfoSchema: ZodSchemaWithInputMatchingOutput<ProConnectInfos> =
  z.object({
    externalId: zStringCanBeEmpty, // Si proConnecté et donc externalId fourni, alors pourquoi chaine vide?
    siret: siretSchema,
  });
