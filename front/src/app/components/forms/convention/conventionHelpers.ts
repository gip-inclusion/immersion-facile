import {
  ConventionDto,
  DepartmentCode,
  EstablishmentTutor,
  InternshipKind,
  OmitFromExistingKeys,
  Signatories,
} from "shared";

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

type WithAgencyDepartment = {
  agencyDepartment: DepartmentCode;
};

type WithIntershipKind = {
  internshipKind: InternshipKind;
};

export type ConventionPresentation = OmitFromExistingKeys<
  Partial<ConventionDto>,
  "statusJustification"
> &
  WithSignatures &
  WithEstablishmentTutor &
  WithIntershipKind &
  WithAgencyDepartment;
