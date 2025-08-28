import {
  agencyKindSchema,
  type ConventionReadDto,
  conventionSchema,
  type EstablishmentTutor,
  type InternshipKind,
  type OmitFromExistingKeys,
  refersToAgencyIdSchema,
  type Signatories,
  type ZodSchemaWithInputMatchingOutput,
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

export type CreateConventionPresentationInitialValues = OmitFromExistingKeys<
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

export type ConventionPresentation = OmitFromExistingKeys<
  ConventionReadDto,
  | "agencyKind"
  | "agencyName"
  | "agencyCounsellorEmails"
  | "agencyValidatorEmails"
  | "agencySiret"
> &
  WithSignatures &
  WithFromPeConnectedUser;

export const conventionPresentationSchema: ZodSchemaWithInputMatchingOutput<ConventionPresentation> =
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

export type WithStatusJustification = {
  statusJustification: string;
};

export const statusJustificationSchema: ZodSchemaWithInputMatchingOutput<WithStatusJustification> =
  z.object({
    statusJustification: zStringMinLength1,
  });
