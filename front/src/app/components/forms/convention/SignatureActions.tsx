import React from "react";
import { useFormContext } from "react-hook-form";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import {
  ConventionField,
  getConventionFieldName,
  InternshipKind,
  keys,
  Signatory,
  SignatoryRole,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
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
  onSubmitClick: React.MouseEventHandler<HTMLButtonElement>;
  onModificationRequired: React.MouseEventHandler<HTMLButtonElement>;
};

export const SignatureActions = ({
  alreadySigned,
  onModificationRequired,
  onSubmitClick,
  signatory,
  internshipKind,
}: SignatureActionsProperties) => {
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const { fieldName, signatoryFullName, signatoryFunction } =
    getSignatoryProcessedData(signatory);
  const { setValue, formState, register } = useFormContext();
  const getFieldError = makeFieldError(formState);
  return (
    <>
      <Checkbox
        options={[
          {
            label: `Je, soussigné ${signatoryFullName} (${signatoryFunction})
            m'engage à avoir pris connaissance des dispositions réglementaires ${
              internshipKind === "immersion" ? "de la PMSMP" : "du mini stage"
            } et à les respecter *`,
            nativeInputProps: {
              ...register(fieldName),
              defaultChecked: false,
              onChange: (event) => {
                setValue(
                  fieldName,
                  event.target.checked ? new Date().toISOString() : undefined,
                  {
                    shouldValidate: true,
                  },
                );
              },
            },
          },
        ]}
        hintText={
          <a
            target="_blank"
            href={
              internshipKind === "immersion"
                ? "https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
                : "https://immersion.cellar-c2.services.clever-cloud.com/annexe_mini_stage_CCI.pdf"
            }
            rel="noreferrer"
          >
            Avant de répondre, consultez ces dispositions ici
          </a>
        }
        disabled={alreadySigned}
        {...getFieldError(fieldName)}
      />

      <ButtonsGroup
        alignment="center"
        buttonsEquisized={true}
        buttons={[
          {
            priority: "primary",
            children: "Confirmer et signer",
            disabled:
              keys(formState.errors).length > 0 ||
              isLoading ||
              submitFeedback.kind !== "idle",
            onClick: onSubmitClick,
            type: "button",
            iconId: "fr-icon-checkbox-circle-line",
            iconPosition: "left",
          },
          {
            priority: "secondary",
            children: "Annuler les signatures et demander des modifications",
            disabled: isLoading || submitFeedback.kind !== "idle",
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
