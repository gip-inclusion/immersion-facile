import { ReactNode } from "react";

import {
  BeneficiaryCurrentEmployer,
  Beneficiary,
  BeneficiaryRepresentative,
  ConventionReadDto,
  EstablishmentRepresentative,
  EstablishmentTutor,
} from "shared";

export type FieldsAndTitle = {
  listTitle: string;
  cols?: string[];
  rowFields: RowFields[];
  additionalClasses?: string;
};

export type ConventionField =
  | keyof ConventionReadDto
  | `establishmentTutor.${keyof EstablishmentTutor}`
  | `signatories.beneficiary.${keyof Beneficiary}`
  | `signatories.beneficiaryRepresentative.${keyof BeneficiaryRepresentative}`
  | `signatories.beneficiaryCurrentEmployer.${keyof BeneficiaryCurrentEmployer}`
  | `signatories.establishmentRepresentative.${keyof EstablishmentRepresentative}`;

export type RowFields = {
  title?: string;
  fields: ColField[];
};

export type ColField = {
  key: ConventionField | "additionnalInfos";
  colLabel: string;
  value?: (convention: ConventionReadDto) => string | ReactNode;
} | null;
