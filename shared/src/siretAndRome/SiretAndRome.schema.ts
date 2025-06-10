import { z } from "zod/v4";
import { romeCodeSchema } from "../rome";
import { siretSchema } from "../siret/siret.schema";
import type { SiretAndRomeDto } from "./SiretAndRome.dto";

export const siretAndRomeSchema: z.Schema<SiretAndRomeDto> = z.object({
  rome: romeCodeSchema,
  siret: siretSchema,
});
