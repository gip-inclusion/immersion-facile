import {
  type ConventionReadDto,
  type EstablishmentTutor,
  type InternshipKind,
  type OmitFromExistingKeys,
  type Signatories,
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
      agencyRefersTo: z
        .object({
          id: refersToAgencyIdSchema,
          name: zStringMinLength1,
          kind: agencyKindSchema,
        })
        .optional(),
    }),
  );

export type StatusJustification = {
  statusJustification: string;
};

export const statusJustificationSchema: z.Schema<StatusJustification> =
  z.object({
    statusJustification: zStringMinLength1,
  });
