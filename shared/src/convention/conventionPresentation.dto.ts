import type { OmitFromExistingKeys } from "../utils";
import type {
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

export type WithConventionDraftId = {
  id: ConventionDraftId;
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
  WithSignatures &
  WithFromPeConnectedUser;

export type WithStatusJustification = {
  statusJustification: string;
};
