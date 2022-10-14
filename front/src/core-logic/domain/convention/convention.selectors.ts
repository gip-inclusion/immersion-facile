import { createSelector } from "@reduxjs/toolkit";
import {
  ConventionDto,
  ConventionField,
  getConventionFieldName,
  Signatory,
  SignatoryRole,
} from "shared";
import type { RootState } from "src/core-logic/storeConfig/store";

const conventionState = (state: RootState) => state.convention;

const feedback = createSelector(conventionState, ({ feedback }) => feedback);

const convention = createSelector(
  conventionState,
  ({ convention }) => convention,
);

const fetchError = createSelector(
  conventionState,
  ({ fetchError }) => fetchError,
);

const isLoading = createSelector(conventionState, ({ isLoading }) => isLoading);

type SignatoryData = {
  signatory: Signatory | null;
  signedAtFieldName: ConventionField | null;
};

const signatoryData = createSelector(
  conventionState,
  ({ convention, currentSignatoryRole }): SignatoryData => {
    if (!convention || !currentSignatoryRole)
      return { signatory: null, signedAtFieldName: null };
    return signatoryDataFromConvention(convention, currentSignatoryRole);
  },
);

export const conventionSelectors = {
  convention,
  fetchError,
  feedback,
  signatoryData,
  isLoading,
};

export const signatoryDataFromConvention = (
  convention: ConventionDto,
  signatoryRole: SignatoryRole,
): SignatoryData => {
  const establishmentRepresentative: SignatoryData = {
    signatory: convention.signatories.establishmentRepresentative,
    signedAtFieldName: getConventionFieldName(
      "signatories.establishmentRepresentative.signedAt",
    ),
  };

  const beneficiary: SignatoryData = {
    signatory: convention.signatories.beneficiary,
    signedAtFieldName: getConventionFieldName(
      "signatories.beneficiary.signedAt",
    ),
  };

  const getBeneficiaryRepresentative = (): SignatoryData => {
    if (!convention.signatories.beneficiaryRepresentative)
      return { signatory: null, signedAtFieldName: null };
    return {
      signatory: convention.signatories.beneficiaryRepresentative,
      signedAtFieldName: getConventionFieldName(
        "signatories.beneficiaryRepresentative.signedAt",
      ),
    };
  };

  const dataByRole: Record<
    SignatoryRole,
    {
      signatory: Signatory | null;
      signedAtFieldName: ConventionField | null;
    }
  > = {
    beneficiary,
    "beneficiary-representative": getBeneficiaryRepresentative(),
    "legal-representative": getBeneficiaryRepresentative(),
    establishment: establishmentRepresentative,
    "establishment-representative": establishmentRepresentative,
  };

  return dataByRole[signatoryRole];
};
