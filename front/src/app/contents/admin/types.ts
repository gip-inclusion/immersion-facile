import type {
  AgencyRefersToInConvention,
  Beneficiary,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionReadDto,
  EstablishmentRepresentative,
  EstablishmentTutor,
  Renewed,
  WithOptionalFirstnameAndLastname,
} from "shared";

export type ConventionField =
  | keyof ConventionReadDto
  | `agencyRefersTo.${keyof AgencyRefersToInConvention}`
  | `agencyReferent.${keyof WithOptionalFirstnameAndLastname}`
  | `renewed.${keyof Renewed}`
  | `establishmentTutor.${keyof EstablishmentTutor}`
  | `signatories.beneficiary.${keyof Beneficiary<"immersion">}`
  | `signatories.beneficiary.${keyof Beneficiary<"mini-stage-cci">}`
  | `signatories.beneficiaryRepresentative.${keyof BeneficiaryRepresentative}`
  | `signatories.beneficiaryCurrentEmployer.${keyof BeneficiaryCurrentEmployer}`
  | `signatories.establishmentRepresentative.${keyof EstablishmentRepresentative}`;
