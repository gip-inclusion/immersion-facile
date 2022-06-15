import { useFormikContext } from "formik";
import React from "react";
import type { ConventionDto } from "shared/src/convention/convention.dto";
import { BeneficiaryCommonFields } from "src/app/pages/Convention/ConventionFields/BeneficiaryCommonFields";
import { EstablishmentCommonFields } from "src/app/pages/Convention/ConventionFields/EstablishmentCommonFields";
import { ImmersionConditionsCommonFields } from "src/app/pages/Convention/ConventionFields/ImmersionConditionsCommonFields";
import { makeValuesToWatchInUrlForUkraine } from "src/app/pages/Convention/ConventionFields/makeValuesToWatchInUrl";
import { SignatureActions } from "src/app/pages/Convention/ConventionFields/SignatureActions";
import { SubmitButton } from "src/app/pages/Convention/ConventionFields/SubmitButtons";
import { useConventionWatchValuesInUrl } from "src/app/pages/Convention/ConventionFields/useConventionWatchValuesInUrl";
import { ConventionFrozenMessage } from "src/app/pages/Convention/ConventionFrozenMessage";
import { ConventionSignOnlyMessage } from "src/app/pages/Convention/ConventionSignOnlyMessage";
import { FormSectionTitle } from "src/uiComponents/FormSectionTitle";

type ConventionFieldsProps = {
  isFrozen?: boolean;
  isSignOnly?: boolean;
  isSignatureEnterprise?: boolean; //< Ignored if !isSignOnly. Determines who's signing (enterprise or beneficiary)
  signeeName?: string; //< Ignored if !isSignOnly. Name of the person signing.
  alreadySubmitted?: boolean;
  onRejectForm?: () => Promise<void>; //< called when the form is sent back for modifications in signature mode
};

export const ConventionFormFieldsUkraine = ({
  isFrozen,
  isSignOnly: isSignatureMode,
  isSignatureEnterprise,
  signeeName,
  alreadySubmitted,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onRejectForm = async () => {},
}: ConventionFieldsProps) => {
  const { errors, submitCount, isSubmitting, submitForm, values } =
    useFormikContext<ConventionDto>();
  const watchedValues = makeValuesToWatchInUrlForUkraine(values);
  useConventionWatchValuesInUrl(watchedValues);

  return (
    <>
      {isFrozen && !isSignatureMode && <ConventionFrozenMessage />}
      {isFrozen && isSignatureMode && (
        <ConventionSignOnlyMessage
          isAlreadySigned={alreadySubmitted ?? false}
        />
      )}
      <FormSectionTitle>1. Coordonnées du bénéficiaire</FormSectionTitle>
      <BeneficiaryCommonFields disabled={isFrozen} />
      <FormSectionTitle>2. Coordonnées de l'entreprise</FormSectionTitle>
      <h4>
        Les questions suivantes doivent être complétées avec la personne qui
        vous accueillera pendant votre immersion
      </h4>
      <EstablishmentCommonFields disabled={isFrozen} />
      <FormSectionTitle>
        3. Conditions d’accueil de l’immersion professionnelle
      </FormSectionTitle>
      <ImmersionConditionsCommonFields disabled={isFrozen} />
      <p />
      <p />
      {!isSignatureMode &&
        submitCount !== 0 &&
        Object.values(errors).length > 0 && (
          <div style={{ color: "red" }}>
            Veuillez corriger les champs erronés
          </div>
        )}
      {!isFrozen && (
        <p className="font-bold">
          Une fois le formulaire envoyé, vous allez recevoir une demande de
          validation par mail et l'entreprise également.
        </p>
      )}
      <br />
      {!isFrozen && !isSignatureMode && (
        <SubmitButton isSubmitting={isSubmitting} onSubmit={submitForm} />
      )}
      {isSignatureMode && (
        <>
          {alreadySubmitted ? (
            <p>Vous avez signé la convention.</p>
          ) : (
            <SignatureActions
              isSignatureEnterprise={isSignatureEnterprise}
              signeeName={signeeName}
              isSubmitting={isSubmitting}
              onSubmit={submitForm}
              onRejectForm={onRejectForm}
            />
          )}
        </>
      )}
    </>
  );
};
