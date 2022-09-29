import { z } from "zod";
import { romeCodeSchema } from "../rome";
import { siretSchema } from "../siret";
import { SiretAndRomeDto } from "./SiretAndRome.dto";

export const siretAndRomeSchema: z.Schema<SiretAndRomeDto> = z.object({
  rome: romeCodeSchema,
  siret: siretSchema,
});
