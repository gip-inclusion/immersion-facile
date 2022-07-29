import {
  businessContactSchema,
  formEstablishmentSourceSchema,
} from "shared/src/formEstablishment/FormEstablishment.schema";
import { nafSchema } from "shared/src/naf";
import { appellationDtoSchema } from "shared/src/romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "shared/src/siret";
import { addressWithPostalCodeSchema } from "shared/src/utils/postalCode";
import {
  zBoolean,
  zStringPossiblyEmpty,
  zTrimmedString,
} from "shared/src/zodUtils";
import { z } from "zod";
import { FormEstablishmentDtoPublicV1 } from "./FormEstablishmentPublicV1.dto";

export const formEstablishmentPublicV1Schema: z.Schema<FormEstablishmentDtoPublicV1> =
  z.object(
    {
      source: formEstablishmentSourceSchema,
      siret: siretSchema,
      businessName: zTrimmedString,
      businessNameCustomized: zTrimmedString.optional(),
      website: zStringPossiblyEmpty.optional(),
      additionalInformation: zStringPossiblyEmpty.optional(),
      businessAddress: addressWithPostalCodeSchema,
      isEngagedEnterprise: zBoolean.optional(),
      naf: nafSchema.optional(),
      appellations: z
        .array(appellationDtoSchema)
        .min(1, "Spécifiez au moins 1 métier"),
      businessContact: businessContactSchema,
      isSearchable: zBoolean,
    },
    { required_error: "Veuillez compléter le formulaire" },
  );
