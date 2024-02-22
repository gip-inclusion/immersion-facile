import { z } from "zod";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { zUuidLike } from "../zodUtils";
import {
  SearchResultQuery,
  SiretAndAppellationDto,
} from "./SiretAndAppellation.dto";

const siretAndAppellationShape = {
  appellationCode: appellationCodeSchema,
  siret: siretSchema,
};

export const siretAndAppellationSchema: z.Schema<SiretAndAppellationDto> =
  z.object(siretAndAppellationShape);

export const searchResultQuerySchema: z.Schema<SearchResultQuery> = z.object({
  ...siretAndAppellationShape,
  locationId: zUuidLike,
});
