import { z } from "zod";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { type ZodSchemaWithInputMatchingOutput, zUuidLike } from "../zodUtils";
import type {
  SearchResultQuery,
  SiretAndAppellationDto,
} from "./SiretAndAppellation.dto";

const siretAndAppellationShape = {
  appellationCode: appellationCodeSchema,
  siret: siretSchema,
};

export const siretAndAppellationSchema: ZodSchemaWithInputMatchingOutput<SiretAndAppellationDto> =
  z.object(siretAndAppellationShape);

export const searchResultQuerySchema: ZodSchemaWithInputMatchingOutput<SearchResultQuery> =
  z.object({
    ...siretAndAppellationShape,
    locationId: zUuidLike,
  });
