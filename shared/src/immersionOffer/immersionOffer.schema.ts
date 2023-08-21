import { z } from "zod";
import { appellationSchema } from "../rome";
import { SearchImmersionResultDto } from "../searchImmersion/SearchImmersionResult.dto";
import { searchImmersionResultSchema } from "../searchImmersion/SearchImmersionResult.schema";
import { siretSchema } from "../siret/siret.schema";
import { ImmersionOfferInput } from "./immersionOffer.dto";

export const immersionOfferInputSchema: z.Schema<ImmersionOfferInput> =
  z.object({
    siret: siretSchema,
    appellationCode: appellationSchema,
  });

export const immersionOfferResponseSchema: z.Schema<SearchImmersionResultDto> =
  searchImmersionResultSchema;
