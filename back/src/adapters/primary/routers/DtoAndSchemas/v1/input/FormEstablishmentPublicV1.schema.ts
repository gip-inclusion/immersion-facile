import { businessContactSchema, formEstablishmentSourceSchema } from "shared";
import { nafSchema } from "shared";
import { appellationDtoSchema } from "shared";
import { siretSchema } from "shared";
import { addressWithPostalCodeSchema } from "shared";
import { zBoolean, zStringPossiblyEmpty, zTrimmedString } from "shared";
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
