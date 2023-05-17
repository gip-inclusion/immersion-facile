import React, { useEffect } from "react";
import { type SubmitHandler, useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { keys } from "ramda";
import {
  ConventionReadDto,
  domElementIds,
  Signatory,
  toDotNotation,
} from "shared";
import { ErrorNotifications } from "react-design-system";
import { ConventionFrozenMessage } from "src/app/components/forms/convention/ConventionFrozenMessage";
import { ConventionSignOnlyMessage } from "src/app/components/forms/convention/ConventionSignOnlyMessage";
import { makeValuesToWatchInUrl } from "src/app/components/forms/convention/makeValuesToWatchInUrl";
import { SignatureActions } from "src/app/components/forms/convention/SignatureActions";
import { useConventionWatchValuesInUrl } from "src/app/components/forms/convention/useConventionWatchValuesInUrl";
import {
  formConventionFieldsLabels,
  formUiSections,
} from "src/app/contents/forms/convention/formConvention";
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
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { AgencyFormSection } from "./sections/agency/AgencyFormSection";
import { BeneficiaryFormSection } from "./sections/beneficiary/BeneficiaryFormSection";
import { EstablishmentFormSection } from "./sections/establishment/EstablishmentFormSection";
import { ImmersionHourLocationSection } from "./sections/hour-location/ImmersionHourLocationSection";
import { ImmersionDetailsSection } from "./sections/immersion-details/ImmersionDetailsSection";

type ConventionFieldsProps = {
  isFrozen?: boolean;
  onSubmit: SubmitHandler<ConventionReadDto>;
  onModificationsRequired?: () => void; //< called when the form is sent back for modifications in signature mode
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
    formState: { errors, submitCount, isSubmitted },
    trigger,
    getFieldState,
  } = useFormContext<ConventionReadDto>();
  const currentStep = useAppSelector(conventionSelectors.currentStep);
  const conventionValues = getValues();
  const conventionSubmitFeedback = useAppSelector(conventionSelectors.feedback);
  const preselectedAgencyId = useAppSelector(
    conventionSelectors.preselectedAgencyId,
  );
  const route = useRoute();
  const isLoading = useAppSelector(conventionSelectors.isLoading);

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
  const dispatch = useDispatch();
  const formContents = getFormFields();
  const t = useConventionTexts(conventionValues.internshipKind);
  const shouldSubmitButtonBeDisabled =
    isLoading ||
    (isSubmitted && conventionSubmitFeedback.kind === "justSubmitted");
  const makeAccordionProps = (step: number) => ({
    onExpandedChange: () => {
      validateStep(currentStep);
      dispatch(conventionSlice.actions.setCurrentStep(step));
    },
    expanded: currentStep === step,
  });
  const renderStatusBadge = (step: number) => {
    const stepFields = formUiSections[step - 1];
    const stepErrors = keys(errors).filter((key) =>
      stepFields.includes(key),
    ).length;
    const stepIsValid = () =>
      stepFields.filter(
        (key) => getFieldState(key).isTouched && stepErrors === 0,
      ).length === stepFields.length;
    const getSeverity = () => {
      if (stepErrors) {
        return "error";
      }
      if (stepIsValid()) {
        return "success";
      }
      return "info";
    };
    const getLabel = () => {
      if (stepErrors) {
        return "Erreur";
      }
      if (stepIsValid()) {
        return "Complet";
      }
      return "À compléter";
    };
    return (
      <Badge severity={getSeverity()} className={fr.cx("fr-ml-2w")}>
        {getLabel()}
      </Badge>
    );
  };
  const renderSectionTitle = (title: string, step: number) => {
    const baseText = currentStep === step ? <strong>{title}</strong> : title;
    return (
      <>
        {baseText}
        {renderStatusBadge(step)}
      </>
    );
  };
  const validateStep = (step: number) => {
    const stepFields = formUiSections[step - 1];
    stepFields.forEach(async (field) => {
      await trigger(field as keyof ConventionReadDto);
    });
  };
  console.log("errors", errors);
  return (
    <>
      {isFrozen && !isSignatureMode && <ConventionFrozenMessage />}
      {isFrozen && isSignatureMode && (
        <ConventionSignOnlyMessage
          isAlreadySigned={alreadySigned ?? false}
          internshipKind={conventionValues.internshipKind}
        />
      )}
      <input
        type="hidden"
        {...formContents["signatories.beneficiary.federatedIdentity"]}
      />
      <div className={fr.cx("fr-accordions-group")}>
        {route.name !== "conventionCustomAgency" && (
          <Accordion
            label={renderSectionTitle(t.agencySection.title, 1)}
            {...makeAccordionProps(1)}
          >
            <AgencyFormSection
              internshipKind={conventionValues.internshipKind}
              agencyId={conventionValues.agencyId}
              enablePeConnectApi={enablePeConnectApi}
              isFrozen={isFrozen}
            />
          </Accordion>
        )}

        <Accordion
          label={renderSectionTitle(t.beneficiarySection.title, 2)}
          {...makeAccordionProps(2)}
        >
          <BeneficiaryFormSection
            isFrozen={isFrozen}
            internshipKind={conventionValues.internshipKind}
          />
        </Accordion>
        <Accordion
          label={renderSectionTitle(t.establishmentSection.title, 3)}
          {...makeAccordionProps(3)}
        >
          <EstablishmentFormSection isFrozen={isFrozen} />
        </Accordion>
        <Accordion
          label={renderSectionTitle(t.immersionHourLocationSection.title, 4)}
          {...makeAccordionProps(4)}
        >
          <ImmersionHourLocationSection />
        </Accordion>
        <Accordion
          label={renderSectionTitle(t.immersionDetailsSection.title, 5)}
          {...makeAccordionProps(5)}
        >
          <ImmersionDetailsSection disabled={isFrozen} />
        </Accordion>
      </div>

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

      {!isFrozen && !isSignatureMode && (
        <div className={fr.cx("fr-mt-4w")}>
          <Button
            disabled={shouldSubmitButtonBeDisabled}
            iconId="fr-icon-checkbox-circle-line"
            iconPosition="left"
            type="button"
            nativeButtonProps={{
              id: domElementIds.conventionImmersionRoute.submitFormButton,
            }}
            onClick={handleSubmit(
              (values) => {
                setValue("status", "READY_TO_SIGN");
                return onSubmit({ ...values, status: "READY_TO_SIGN" });
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
              onSubmitClick={handleSubmit(onSubmit, (errors) => {
                // eslint-disable-next-line no-console
                console.error(getValues(), errors);
              })}
              onModificationRequired={onModificationsRequired}
            />
          )}
        </>
      )}
    </>
  );
};
