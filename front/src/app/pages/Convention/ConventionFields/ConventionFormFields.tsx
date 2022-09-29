import { useFormikContext } from "formik";
import React, { useEffect } from "react";
import type { ConventionDto, Signatory } from "shared";
import { getConventionFieldName } from "shared";
import { AgencyDisplay } from "src/app/components/AgencyDisplay";
import { AgencySelector } from "src/app/components/AgencySelector";
import { deviceRepository } from "src/app/config/dependencies";
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
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { FormSectionTitle } from "src/uiComponents/FormSectionTitle";

type ConventionFieldsProps = {
  isFrozen?: boolean;
  onRejectForm?: () => Promise<void>; //< called when the form is sent back for modifications in signature mode
} & (
  | { isSignOnly: true; signatory: Signatory }
  | { isSignOnly?: false; signatory?: undefined }
);

export const ConventionFormFields = ({
  isFrozen,
  isSignOnly: isSignatureMode,
  signatory,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onRejectForm = async () => {},
}: ConventionFieldsProps) => {
  useEffect(() => {
    deviceRepository.delete("partialConventionInUrl");
  }, []);

  const alreadySigned = !!signatory?.signedAt;

  const { errors, submitCount, isSubmitting, submitForm, values } =
    useFormikContext<ConventionDto>();
  const { enablePeConnectApi } = useFeatureFlags();
  const watchedValues = makeValuesToWatchInUrl(values);
  useConventionWatchValuesInUrl(watchedValues);
  const t = useConventionTextsFromFormikContext();

  return (
    <>
      {isFrozen && !isSignatureMode && <ConventionFrozenMessage />}
      {isFrozen && isSignatureMode && (
        <ConventionSignOnlyMessage isAlreadySigned={alreadySigned ?? false} />
      )}
      <input
        type="hidden"
        name={getConventionFieldName(
          "signatories.beneficiary.federatedIdentity",
        )}
      />
      <FormSectionTitle>{t.forStartWeNeed}</FormSectionTitle>
      {isFrozen ? (
        <AgencyDisplay
          label={`${t.yourAgencyLabel} *`}
          agencyId={values.agencyId}
        />
      ) : (
        <AgencySelector
          label={`${t.yourAgencyLabel} *`}
          disabled={isFrozen}
          defaultAgencyId={values.agencyId}
          shouldListAll={!enablePeConnectApi}
        />
      )}
      <FormSectionTitle>{t.sectionTitles.beneficiary}</FormSectionTitle>
      <BeneficiaryCommonFields disabled={isFrozen} />
      <FormSectionTitle>
        {t.sectionTitles.establishment}
        <ShareActions
          isFrozen={isFrozen}
          federatedIdentity={values.signatories.beneficiary.federatedIdentity}
        />
      </FormSectionTitle>
      <h4>{t.establishment.subtitle}</h4>
      <EstablishmentCommonFields disabled={isFrozen} />
      <FormSectionTitle>
        {t.sectionTitles.conditionsToHost}
        <ShareActions
          isFrozen={isFrozen}
          federatedIdentity={values.signatories.beneficiary.federatedIdentity}
        />
      </FormSectionTitle>
      <ImmersionConditionsCommonFields disabled={isFrozen} />
      <p />
      <p />
      {!isSignatureMode &&
        submitCount !== 0 &&
        Object.values(errors).length > 0 && (
          <div style={{ color: "red" }}>{t.signatures.fixErrors}</div>
        )}
      {!isFrozen && <p className="font-bold">{t.signatures.validationText}</p>}
      <br />
      {!isFrozen && !isSignatureMode && (
        <SubmitButton isSubmitting={isSubmitting} onSubmit={submitForm} />
      )}
      {isSignatureMode && (
        <>
          {alreadySigned ? (
            <p>{t.conventionAlreadySigned}</p>
          ) : (
            <SignatureActions
              signatory={signatory}
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
