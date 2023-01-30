import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import React from "react";
import {
  ConventionField,
  getConventionFieldName,
  InternshipKind,
  Signatory,
  SignatoryRole,
} from "shared";
import { DateCheckboxGroup } from "src/app/components/forms/commons/CheckboxGroup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

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
  "beneficiary-current-employer": {
    fieldName: getConventionFieldName(
      "signatories.beneficiaryCurrentEmployer.signedAt",
    ),
    signatoryFunction: "employeur actuel du bénéficiaire",
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

type SignatureActionsProperties = {
  signatory: Signatory;
  internshipKind: InternshipKind;
  alreadySigned: boolean;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  onModificationRequired: () => Promise<void>;
};

export const SignatureActions = ({
  alreadySigned,
  isSubmitting,
  onModificationRequired,
  onSubmit,
  signatory,
  internshipKind,
}: SignatureActionsProperties) => {
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const { fieldName, signatoryFullName, signatoryFunction } =
    getSignatoryProcessedData(signatory);
  return (
    <>
      <DateCheckboxGroup
        name={fieldName}
        label={`Je, soussigné ${signatoryFullName} (${signatoryFunction})
         m'engage à avoir pris connaissance des dispositions réglementaires ${
           internshipKind === "immersion" ? "de la PMSMP" : "du mini stage"
         } et à les respecter *`}
        description="Avant de répondre, consultez ces dispositions ici"
        descriptionLink={
          internshipKind === "immersion"
            ? "https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
            : "https://immersion.cellar-c2.services.clever-cloud.com/annexe_mini_stage_CCI.pdf"
        }
        disabled={alreadySigned}
      />
      <ButtonsGroup
        alignment="center"
        buttonsEquisized={true}
        buttons={[
          {
            priority: "primary",
            children: "Confirmer et signer",
            disabled: isSubmitting || submitFeedback.kind !== "idle",
            onClick: onSubmit,
            type: "button",
            iconId: "fr-icon-checkbox-circle-line",
            iconPosition: "left",
          },
          {
            priority: "secondary",
            children: "Annuler les signatures et demander des modifications",
            disabled: isSubmitting || submitFeedback.kind !== "idle",
            onClick: onModificationRequired,
            type: "button",
            iconId: "fr-icon-edit-fill",
            iconPosition: "left",
          },
        ]}
      />
    </>
  );
};
