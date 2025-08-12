import z from "zod/v4";
import { siretSchema } from "../../siret/siret.schema";
import { zStringCanBeEmpty } from "../../zodUtils";
import type { ProConnectInfos } from "./proConnect.dto";

export const proConnectInfoSchema: z.Schema<ProConnectInfos> = z.object({
  externalId: zStringCanBeEmpty, // Si proConnecté et donc externalId fourni, alors pourquoi chaine vide?
  siret: siretSchema,
});
