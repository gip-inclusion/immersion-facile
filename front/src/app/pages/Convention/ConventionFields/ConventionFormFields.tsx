import { useFormikContext } from "formik";
import React from "react";
import type { ConventionDto } from "shared/src/convention/convention.dto";
import { AgencyDisplay } from "src/app/components/AgencyDisplay";
import { AgencySelector } from "src/app/components/AgencySelector";
import { BeneficiaryCommonFields } from "src/app/pages/Convention/ConventionFields/BeneficiaryCommonFields";
import { EstablishmentCommonFields } from "src/app/pages/Convention/ConventionFields/EstablishmentCommonFields";
import { ImmersionConditionsCommonFields } from "src/app/pages/Convention/ConventionFields/ImmersionConditionsCommonFields";
import { makeValuesToWatchInUrl } from "src/app/pages/Convention/ConventionFields/makeValuesToWatchInUrl";
import { ShareActions } from "src/app/pages/Convention/ConventionFields/ShareActions";
import { SignatureActions } from "src/app/pages/Convention/ConventionFields/SignatureActions";
import { SubmitButton } from "src/app/pages/Convention/ConventionFields/SubmitButtons";
import { useConventionWatchValuesInUrl } from "src/app/pages/Convention/ConventionFields/useConventionWatchValuesInUrl";
import { ConventionFrozenMessage } from "src/app/pages/Convention/ConventionFrozenMessage";
import { ConventionSignOnlyMessage } from "src/app/pages/Convention/ConventionSignOnlyMessage";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { FormSectionTitle } from "src/uiComponents/FormSectionTitle";

type ConventionFieldsProps = {
  isFrozen?: boolean;
  isSignOnly?: boolean;
  isSignatureEnterprise?: boolean; //< Ignored if !isSignOnly. Determines who's signing (enterprise or beneficiary)
  signeeName?: string; //< Ignored if !isSignOnly. Name of the person signing.
  alreadySubmitted?: boolean;
  onRejectForm?: () => Promise<void>; //< called when the form is sent back for modifications in signature mode
};

export const ConventionFormFields = ({
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
  const { enablePeConnectApi } = useFeatureFlags();
  const watchedValues = makeValuesToWatchInUrl(values);
  useConventionWatchValuesInUrl(watchedValues);

  return (
    <>
      {isFrozen && !isSignatureMode && <ConventionFrozenMessage />}
      {isFrozen && isSignatureMode && (
        <ConventionSignOnlyMessage
          isAlreadySigned={alreadySubmitted ?? false}
        />
      )}
      <input type="hidden" name="federatedIdentity" />
      <FormSectionTitle>1. Coordonnées du bénéficiaire</FormSectionTitle>
      {isFrozen ? (
        <AgencyDisplay
          label="Votre structure d'accompagnement *"
          agencyId={values.agencyId}
        />
      ) : (
        <AgencySelector
          label="Votre structure d'accompagnement *"
          disabled={isFrozen}
          defaultAgencyId={values.agencyId}
          shouldListAll={!enablePeConnectApi}
        />
      )}
      <BeneficiaryCommonFields disabled={isFrozen} />
      <FormSectionTitle>
        2. Coordonnées de l'entreprise
        <ShareActions
          isFrozen={isFrozen}
          federatedIdentity={values.federatedIdentity}
        />
      </FormSectionTitle>
      <h4>
        Les questions suivantes doivent être complétées avec la personne qui
        vous accueillera pendant votre immersion
      </h4>
      <EstablishmentCommonFields disabled={isFrozen} />
      <FormSectionTitle>
        3. Conditions d’accueil de l’immersion professionnelle
        <ShareActions
          isFrozen={isFrozen}
          federatedIdentity={values.federatedIdentity}
        />
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
