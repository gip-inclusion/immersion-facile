import { z } from "zod";
import { siretSchema } from "../siret";
import { romeCodeSchema } from "../rome";
import { SiretAndRomeDto } from "./SiretAndRome.dto";

export const siretAndRomeSchema: z.Schema<SiretAndRomeDto> = z.object({
  rome: romeCodeSchema,
  siret: siretSchema,
});
