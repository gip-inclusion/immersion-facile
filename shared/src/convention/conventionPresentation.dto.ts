import type { OmitFromExistingKeys } from "../utils";
import type {
  ConventionId,
  ConventionReadDto,
  EstablishmentTutor,
  InternshipKind,
  Signatories,
} from "./convention.dto";
import type { ConventionDraftId } from "./shareConventionDraftByEmail.dto";

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

export type WithConventionIdOrConventionDraftId = {
  id: ConventionId | ConventionDraftId;
};

export type CreateConventionPresentationInitialValues = OmitFromExistingKeys<
  Partial<ConventionReadDto>,
  | "id"
  | "agencyName"
  | "agencyCounsellorEmails"
  | "agencyValidatorEmails"
  | "agencySiret"
> &
  WithConventionIdOrConventionDraftId &
  WithSignatures &
  WithEstablishmentTutor &
  WithIntershipKind &
  WithFromPeConnectedUser;

export type WithConventionDraftId = {
  id: ConventionDraftId;
};

export type ConventionPresentation = OmitFromExistingKeys<
  ConventionReadDto,
  | "id"
  | "agencyKind"
  | "agencyName"
  | "agencyCounsellorEmails"
  | "agencyValidatorEmails"
  | "agencySiret"
  | "agencyContactEmail"
  | "assessment"
> &
  WithConventionIdOrConventionDraftId &
  WithSignatures &
  WithFromPeConnectedUser;

export type WithStatusJustification = {
  statusJustification: string;
};
