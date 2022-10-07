import React from "react";
import {
  ConventionField,
  getConventionFieldName,
  Signatory,
  SignatoryRole,
} from "shared";
import {
  RequestModificationButton,
  SignButton,
} from "src/app/pages/Convention/ConventionFields/SubmitButtons";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { DateCheckboxGroup } from "src/uiComponents/form/CheckboxGroup";

const processedDataBySignatoryRole: Record<
  SignatoryRole,
  {
    fieldName: ConventionField;
    signatoryFunction: string;
  }
> = {
  beneficiary: {
    fieldName: getConventionFieldName("signatories.beneficiary.signedAt"),
    signatoryFunction: "bénéficiaire de l'immersion",
  },
  establishment: {
    fieldName: getConventionFieldName(
      "signatories.establishmentRepresentative.signedAt",
    ),
    signatoryFunction: "représentant de la structure d'accueil",
  },
  "establishment-representative": {
    fieldName: getConventionFieldName(
      "signatories.establishmentRepresentative.signedAt",
    ),
    signatoryFunction: "représentant de la structure d'accueil",
  },
  "beneficiary-representative": {
    fieldName: getConventionFieldName(
      "signatories.beneficiaryRepresentative.signedAt",
    ),
    signatoryFunction: "représentant légal du bénéficiaire",
  },
  "legal-representative": {
    fieldName: getConventionFieldName(
      "signatories.beneficiaryRepresentative.signedAt",
    ),
    signatoryFunction: "représentant légal du bénéficiaire",
  },
};

const getSignatoryProcessedData = (
  signatory: Signatory,
): {
  fieldName: ConventionField;
  signatoryFullName: string;
  signatoryFunction: string;
} => ({
  ...processedDataBySignatoryRole[signatory.role],
  signatoryFullName: `${signatory.firstName} ${signatory.lastName}`,
});

export const SignatureActions = (props: {
  signatory: Signatory;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  onRejectForm: () => Promise<void>;
}) => {
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const { fieldName, signatoryFullName, signatoryFunction } =
    getSignatoryProcessedData(props.signatory);

  return (
    <>
      <DateCheckboxGroup
        name={fieldName}
        label={`Je, soussigné ${signatoryFullName} (${signatoryFunction})
         m'engage à avoir pris connaissance des dispositions réglementaires de la PMSMP et à les respecter *`}
        description="Avant de répondre, consultez ces dispositions ici"
        descriptionLink="https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
        disabled={false}
      />
      <p style={{ display: "flex", gap: "50px" }}>
        <SignButton
          isSubmitting={props.isSubmitting}
          onSubmit={props.onSubmit}
          disabled={submitFeedback !== null}
        />

        <RequestModificationButton
          onSubmit={props.onRejectForm}
          isSubmitting={props.isSubmitting}
          disabled={submitFeedback !== null}
        />
      </p>
    </>
  );
};
