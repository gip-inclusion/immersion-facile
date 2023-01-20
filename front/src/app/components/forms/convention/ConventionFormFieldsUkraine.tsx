import { useFormikContext } from "formik";
import React from "react";
import type { ConventionDto } from "shared";
import { makeValuesToWatchInUrlForUkraine } from "src/app/components/forms/convention/makeValuesToWatchInUrl";
import { SubmitButton } from "src/app/components/forms/convention/SubmitButtons";
import { useConventionWatchValuesInUrl } from "src/app/components/forms/convention/useConventionWatchValuesInUrl";
import { ConventionFrozenMessage } from "src/app/components/forms/convention/ConventionFrozenMessage";
import { ConventionSignOnlyMessage } from "src/app/components/forms/convention/ConventionSignOnlyMessage";
import { SectionTitle } from "react-design-system";
import { BeneficiaryFormSection } from "./sections/beneficiary/BeneficiaryFormSection";
import { EstablishmentFormSection } from "./sections/establishment/EstablishmentFormSection";
import { ImmersionConditionsCommonFields } from "./sections/immersion-conditions/ImmersionConditionsCommonFields";

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
      <BeneficiaryFormSection isFrozen={isFrozen} />

      <EstablishmentFormSection
        isFrozen={isFrozen}
        federatedIdentity={undefined}
      />

      <SectionTitle>
        3. Conditions d’accueil de l’immersion professionnelle
      </SectionTitle>
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
