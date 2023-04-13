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

const isMinor = createSelector(conventionState, ({ formUi }) => formUi.isMinor);
const hasCurrentEmployer = createSelector(
  conventionState,
  ({ formUi }) => formUi.hasCurrentEmployer,
);
const isTutorEstablishmentRepresentative = createSelector(
  conventionState,
  ({ formUi }) => formUi.isTutorEstablishmentRepresentative,
);

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

const conventionStatusDashboardUrl = createSelector(
  conventionState,
  ({ conventionStatusDashboardUrl }) => conventionStatusDashboardUrl,
);

const preselectedAgencyId = createSelector(
  conventionState,
  ({ formUi }) => formUi.preselectedAgencyId,
);

export const conventionSelectors = {
  convention,
  fetchError,
  feedback,
  signatoryData,
  isLoading,
  isMinor,
  isTutorEstablishmentRepresentative,
  hasCurrentEmployer,
  conventionStatusDashboardUrl,
  preselectedAgencyId,
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

  const getBeneficiaryCurrentEmployer = (): SignatoryData =>
    convention.signatories.beneficiaryCurrentEmployer
      ? {
          signatory: convention.signatories.beneficiaryCurrentEmployer,
          signedAtFieldName: getConventionFieldName(
            "signatories.beneficiaryCurrentEmployer.signedAt",
          ),
        }
      : { signatory: null, signedAtFieldName: null };

  const getBeneficiaryRepresentative = (): SignatoryData =>
    convention.signatories.beneficiaryRepresentative
      ? {
          signatory: convention.signatories.beneficiaryRepresentative,
          signedAtFieldName: getConventionFieldName(
            "signatories.beneficiaryRepresentative.signedAt",
          ),
        }
      : { signatory: null, signedAtFieldName: null };

  const dataByRole: Record<
    SignatoryRole,
    {
      signatory: Signatory | null;
      signedAtFieldName: ConventionField | null;
    }
  > = {
    beneficiary,
    "beneficiary-current-employer": getBeneficiaryCurrentEmployer(),
    "beneficiary-representative": getBeneficiaryRepresentative(),
    "legal-representative": getBeneficiaryRepresentative(),
    establishment: establishmentRepresentative,
    "establishment-representative": establishmentRepresentative,
  };

  return dataByRole[signatoryRole];
};
