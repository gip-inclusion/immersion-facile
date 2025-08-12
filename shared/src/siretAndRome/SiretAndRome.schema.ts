import { z } from "zod";
import { romeCodeSchema } from "../rome";
import { siretSchema } from "../siret/siret.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type { SiretAndRomeDto } from "./SiretAndRome.dto";

export const siretAndRomeSchema: ZodSchemaWithInputMatchingOutput<SiretAndRomeDto> =
  z.object({
    rome: romeCodeSchema,
    siret: siretSchema,
  });
