import { z } from "zod";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { ImmersionOfferInput } from "./immersionOffer.dto";

export const immersionOfferInputSchema: z.Schema<ImmersionOfferInput> =
  z.object({
    siret: siretSchema,
    appellationCode: appellationCodeSchema,
  });
