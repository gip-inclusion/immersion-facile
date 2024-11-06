import {
  ConventionReadDto,
  EstablishmentTutor,
  InternshipKind,
  OmitFromExistingKeys,
  Signatories,
  agencyKindSchema,
  conventionSchema,
  refersToAgencyIdSchema,
  zStringMinLength1,
} from "shared";
import { z } from "zod";

export const undefinedIfEmptyString = (text?: string): string | undefined =>
  text || undefined;

type WithSignatures = {
  signatories: {
    [K in keyof Signatories]: Partial<Signatories[K]>;
  };
};

type WithEstablishmentTutor = {
  establishmentTutor: EstablishmentTutor;
};

type WithIntershipKind = {
  internshipKind: InternshipKind;
};

type WithFromPeConnectedUser = {
  fromPeConnectedUser?: boolean;
};

export type ConventionPresentation = OmitFromExistingKeys<
  Partial<ConventionReadDto>,
  | "agencyName"
  | "agencyCounsellorEmails"
  | "agencyValidatorEmails"
  | "agencySiret"
> &
  WithSignatures &
  WithEstablishmentTutor &
  WithIntershipKind &
  WithFromPeConnectedUser;

export const conventionPresentationSchema: z.Schema<ConventionPresentation> =
  conventionSchema.and(
    z.object({
      agencyDepartment: z.string(),
      agencyKind: agencyKindSchema,
      agencyRefersTo: z
        .object({
          id: refersToAgencyIdSchema,
          name: zStringMinLength1,
          kind: agencyKindSchema,
        })
        .optional(),
    }),
  );
