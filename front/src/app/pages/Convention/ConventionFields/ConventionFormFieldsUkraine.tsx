import { useFormikContext } from "formik";
import React from "react";
import type { ConventionDto } from "shared";
import { BeneficiaryCommonFields } from "src/app/pages/Convention/ConventionFields/BeneficiaryCommonFields";
import { EstablishmentCommonFields } from "src/app/pages/Convention/ConventionFields/EstablishmentCommonFields";
import { ImmersionConditionsCommonFields } from "src/app/pages/Convention/ConventionFields/ImmersionConditionsCommonFields";
import { makeValuesToWatchInUrlForUkraine } from "src/app/pages/Convention/ConventionFields/makeValuesToWatchInUrl";
import { SubmitButton } from "src/app/pages/Convention/ConventionFields/SubmitButtons";
import { useConventionWatchValuesInUrl } from "src/app/pages/Convention/ConventionFields/useConventionWatchValuesInUrl";
import { ConventionFrozenMessage } from "src/app/pages/Convention/ConventionFrozenMessage";
import { ConventionSignOnlyMessage } from "src/app/pages/Convention/ConventionSignOnlyMessage";
import { FormSectionTitle } from "src/uiComponents/FormSectionTitle";

type ConventionFieldsProps = {
  isFrozen?: boolean;
  isSignOnly?: boolean;
  alreadySubmitted?: boolean;
};

export const ConventionFormFieldsUkraine = ({
  isFrozen,
  isSignOnly: isSignatureMode,
  alreadySubmitted,
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
      {!isFrozen && !isSignatureMode && (
        <div className="fr-mt-1w">
          <SubmitButton isSubmitting={isSubmitting} onSubmit={submitForm} />
        </div>
      )}
    </>
  );
};
