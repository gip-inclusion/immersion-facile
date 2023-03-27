import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import React, { useEffect } from "react";
import { ErrorNotifications } from "react-design-system";
import { useFormContext, type SubmitHandler } from "react-hook-form";
import { ConventionReadDto, Signatory, toDotNotation } from "shared";
import { ConventionFrozenMessage } from "src/app/components/forms/convention/ConventionFrozenMessage";
import { ConventionSignOnlyMessage } from "src/app/components/forms/convention/ConventionSignOnlyMessage";
import { makeValuesToWatchInUrl } from "src/app/components/forms/convention/makeValuesToWatchInUrl";
import { SignatureActions } from "src/app/components/forms/convention/SignatureActions";
import { useConventionWatchValuesInUrl } from "src/app/components/forms/convention/useConventionWatchValuesInUrl";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import {
  formErrorsToFlatErrors,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { useRoute } from "src/app/routes/routes";
import { deviceRepository } from "src/config/dependencies";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { AgencyFormSection } from "./sections/agency/AgencyFormSection";
import { BeneficiaryFormSection } from "./sections/beneficiary/BeneficiaryFormSection";
import { EstablishmentFormSection } from "./sections/establishment/EstablishmentFormSection";
import { ImmersionConditionFormSection } from "./sections/immersion-conditions/ImmersionConditionFormSection";

type ConventionFieldsProps = {
  isFrozen?: boolean;
  onSubmit: SubmitHandler<ConventionReadDto>;
  onModificationsRequired?: () => Promise<void>; //< called when the form is sent back for modifications in signature mode
} & (
  | { isSignOnly: true; signatory: Signatory }
  | { isSignOnly?: false; signatory?: undefined }
);

export const ConventionFormFields = ({
  isFrozen,
  onSubmit,
  isSignOnly: isSignatureMode,
  signatory,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onModificationsRequired = async () => {},
}: ConventionFieldsProps): JSX.Element => {
  const {
    setValue,
    getValues,
    handleSubmit,
    formState: { errors, submitCount, isSubmitting, isSubmitted, isValidating },
  } = useFormContext<ConventionReadDto>();
  const conventionValues = getValues();
  const preselectedAgencyId = useAppSelector(
    conventionSelectors.preselectedAgencyId,
  );
  const route = useRoute();

  useEffect(() => {
    deviceRepository.delete("partialConventionInUrl");
  }, []);

  useEffect(() => {
    if (route.name === "conventionCustomAgency" && preselectedAgencyId) {
      setValue("agencyId", preselectedAgencyId);
    }
  }, [preselectedAgencyId]);

  const alreadySigned = !!signatory?.signedAt;

  const { enablePeConnectApi } = useFeatureFlags();
  const watchedValues = makeValuesToWatchInUrl(conventionValues);
  useConventionWatchValuesInUrl(watchedValues);
  const { getFormFields, getFormErrors } = useFormContents(
    formConventionFieldsLabels(conventionValues.internshipKind),
  );
  const formContents = getFormFields();
  const federatedIdentity =
    conventionValues.signatories.beneficiary.federatedIdentity;
  const t = useConventionTexts(conventionValues.internshipKind);
  const shouldSubmitButtonBeDisabled =
    isSubmitting ||
    isValidating ||
    (isSubmitted && Object.values(errors).length === 0);
  return (
    <>
      {isFrozen && !isSignatureMode && <ConventionFrozenMessage />}
      {isFrozen && isSignatureMode && (
        <ConventionSignOnlyMessage isAlreadySigned={alreadySigned ?? false} />
      )}
      <input
        type="hidden"
        {...formContents["signatories.beneficiary.federatedIdentity"]}
      />
      {route.name !== "conventionCustomAgency" && (
        <AgencyFormSection
          internshipKind={conventionValues.internshipKind}
          agencyId={conventionValues.agencyId}
          enablePeConnectApi={enablePeConnectApi}
          isFrozen={isFrozen}
        />
      )}

      <input type="hidden" {...formContents.agencyId} />
      <BeneficiaryFormSection
        isFrozen={isFrozen}
        internshipKind={conventionValues.internshipKind}
      />

      <EstablishmentFormSection
        isFrozen={isFrozen}
        federatedIdentity={federatedIdentity}
      />

      <ImmersionConditionFormSection
        federatedIdentity={federatedIdentity}
        isFrozen={isFrozen}
      />
      {!isFrozen && (
        <Alert
          small
          severity="warning"
          className={fr.cx("fr-my-2w")}
          description={
            <ol>
              <li>
                Une fois le formulaire envoyé, chaque signataire de la
                convention va recevoir un email.
              </li>
              <li>
                Pensez à vérifier votre boîte email et votre dossier de spams.
              </li>
              <li>
                Pensez également à informer les autres signataires de la
                convention qu'ils devront vérifier leur boîte email et leur
                dossier de spams.
              </li>
            </ol>
          }
        />
      )}
      {!isSignatureMode && (
        <ErrorNotifications
          labels={getFormErrors()}
          errors={toDotNotation(formErrorsToFlatErrors(errors))}
          visible={submitCount !== 0 && Object.values(errors).length > 0}
        />
      )}
      {JSON.stringify({
        isSubmitting,
        isValidating,
        isSubmitted,
        isValid: Object.values(errors).length === 0,
      })}
      {!isFrozen && !isSignatureMode && (
        <div className={fr.cx("fr-mt-4w")}>
          <Button
            disabled={shouldSubmitButtonBeDisabled}
            iconId="fr-icon-checkbox-circle-line"
            iconPosition="left"
            type="button"
            onClick={handleSubmit(
              (values) => {
                setValue("status", "READY_TO_SIGN");
                onSubmit(values);
              },
              (errors) => {
                // eslint-disable-next-line no-console
                console.error(getValues(), errors);
              },
            )}
          >
            Envoyer la demande
          </Button>
        </div>
      )}
      {isSignatureMode && (
        <>
          {alreadySigned ? (
            <p>{t.conventionAlreadySigned}</p>
          ) : (
            <SignatureActions
              internshipKind={conventionValues.internshipKind}
              alreadySigned={alreadySigned}
              signatory={signatory}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit(onSubmit)}
              onModificationRequired={onModificationsRequired}
            />
          )}
        </>
      )}
    </>
  );
};
