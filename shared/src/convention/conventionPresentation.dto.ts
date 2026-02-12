import type { OmitFromExistingKeys } from "../utils";
import type {
  ConventionReadDto,
  EstablishmentTutor,
  InternshipKind,
  Signatories,
} from "./convention.dto";
import type { ConventionTemplateId } from "./conventionTemplate.dto";
import type {
  ConventionDraftDto,
  ConventionDraftId,
} from "./shareConventionDraftByEmail.dto";

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

export type CreateConventionTemplatePresentationInitialValues =
  OmitFromExistingKeys<ConventionDraftDto, "id"> & {
    id: ConventionTemplateId;
    name: string;
  };

export type ConventionFormInitialValues =
  | CreateConventionPresentationInitialValues
  | CreateConventionTemplatePresentationInitialValues;

export const isCreateConventionPresentationInitialValues = (
  v: ConventionFormInitialValues,
): v is CreateConventionPresentationInitialValues => !("name" in v);

export type CreateConventionPresentationInitialValues = OmitFromExistingKeys<
  Partial<ConventionReadDto>,
  | "agencyName"
  | "agencyCounsellorEmails"
  | "agencyValidatorEmails"
  | "agencySiret"
> &
  Partial<WithFromConventionDraftId> &
  WithSignatures &
  WithEstablishmentTutor &
  WithIntershipKind &
  WithFromPeConnectedUser;

export type WithFromConventionDraftId = {
  fromConventionDraftId: ConventionDraftId;
};

export type ConventionPresentation = OmitFromExistingKeys<
  ConventionReadDto,
  | "agencyKind"
  | "agencyName"
  | "agencyCounsellorEmails"
  | "agencyValidatorEmails"
  | "agencySiret"
  | "agencyContactEmail"
  | "assessment"
> &
  Partial<WithFromConventionDraftId> &
  WithSignatures &
  WithFromPeConnectedUser;

export type WithStatusJustification = {
  statusJustification: string;
};
