import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { keys } from "ramda";
import { ErrorNotifications } from "react-design-system";
import { useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import { v4 as uuidV4 } from "uuid";

import {
  AppellationAndRomeDto,
  FormEstablishmentDto,
  addressDtoToString,
  domElementIds,
  emptyAppellationAndRome,
  removeAtIndex,
} from "shared";
import { CreationSiretRelatedInputs } from "src/app/components/forms/establishment/CreationSiretRelatedInputs";
import { EditionSiretRelatedInputs } from "src/app/components/forms/establishment/EditionSiretRelatedInputs";
import { MultipleAddressInput } from "src/app/components/forms/establishment/MultipleAddressInput";
import { booleanSelectOptions } from "src/app/contents/forms/common/values";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  displayReadableError,
  getFormContents,
  makeFieldError,
  toErrorsWithLabels,
} from "src/app/hooks/formContents.hooks";
import { useAdminToken } from "src/app/hooks/jwt.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { establishmentSelectors } from "src/core-logic/domain/establishmentPath/establishment.selectors";
import { establishmentSlice } from "src/core-logic/domain/establishmentPath/establishment.slice";
import { P, match } from "ts-pattern";
import { Mode, OnStepChange, Step } from "../EstablishmentForm";
import { MultipleAppellationInput } from "../MultipleAppellationInput";
import { SearchResultPreview } from "../SearchResultPreview";

export const DetailsSection = ({
  mode,
  isEstablishmentAdmin,
  currentStep,
  onStepChange,
  invalidEmailMessage,
}: {
  isEstablishmentAdmin: boolean;
  mode: Mode;
  currentStep: Step;
  onStepChange: OnStepChange;
  invalidEmailMessage: React.ReactNode | null;
}) => {
  const adminJwt = useAdminToken();
  const dispatch = useDispatch();
  const methods = useFormContext<FormEstablishmentDto>();
  const {
    watch,
    setValue,
    register,
    formState: { errors, touchedFields, isSubmitting, submitCount },
  } = methods;
  const formValues = watch();
  const getFieldError = makeFieldError(methods.formState);
  const feedback = useAppSelector(establishmentSelectors.feedback);
  const formErrors = getFormContents(
    formEstablishmentFieldsLabels(mode),
  ).getFormErrors();
  const formContents = getFormContents(
    formEstablishmentFieldsLabels(mode),
  ).getFormFields();

  const onClickEstablishmentDeleteButton = () => {
    const confirmed = confirm(
      `! Etes-vous sûr de vouloir supprimer cet établissement ? !
                (cette opération est irréversible 💀)`,
    );
    if (confirmed && adminJwt)
      dispatch(
        establishmentSlice.actions.establishmentDeletionRequested({
          siret: formValues.siret,
          jwt: adminJwt,
        }),
      );
    if (confirmed && !adminJwt) alert("Vous n'êtes pas admin.");
  };

  const isStepMode = currentStep !== null;

  const buttons: [ButtonProps, ...ButtonProps[]] = [
    {
      children: isEstablishmentAdmin
        ? "Enregistrer les modifications"
        : "Enregistrer mes informations",
      iconId: "fr-icon-checkbox-circle-line",
      iconPosition: "right",
      type: "submit",
      disabled: isSubmitting || invalidEmailMessage !== null,
      id: domElementIds.establishment[mode].submitFormButton,
    },
  ];
  if (isStepMode) {
    buttons.unshift({
      children: "Étape précédente",
      iconId: "fr-icon-arrow-left-line",
      priority: "secondary",
      type: "button",
      id: domElementIds.establishment[mode].previousButtonFromStepAndMode({
        currentStep,
        mode,
      }),
      onClick: () => onStepChange(3, []),
    });
  }

  if (isEstablishmentAdmin) {
    buttons.push({
      children: "Supprimer l'entreprise",
      iconId: "fr-icon-delete-bin-line",
      priority: "secondary",
      type: "button",
      onClick: onClickEstablishmentDeleteButton,
      disabled: isSubmitting,
      id: domElementIds.admin.manageEstablishment.submitDeleteButton,
    });
  }

  return (
    <section className={fr.cx("fr-mb-4w")}>
      <h2 className={fr.cx("fr-text--lead")}>
        Comment souhaitez-vous apparaître dans notre annuaire ?
      </h2>
      {match(mode)
        .with("create", () => <CreationSiretRelatedInputs />)
        .with(P.union("admin", "edit"), () => (
          <EditionSiretRelatedInputs mode={mode} />
        ))
        .exhaustive()}

      <RadioButtons
        {...formContents.isEngagedEnterprise}
        legend={formContents.isEngagedEnterprise.label}
        options={booleanSelectOptions.map((option) => ({
          ...option,
          nativeInputProps: {
            ...option.nativeInputProps,
            checked:
              Boolean(option.nativeInputProps.value) ===
              formValues.isEngagedEnterprise,
            onChange: () => {
              setValue(
                "isEngagedEnterprise",
                option.nativeInputProps.value === 1,
              );
            },
          },
        }))}
      />
      <RadioButtons
        {...formContents.fitForDisabledWorkers}
        legend={formContents.fitForDisabledWorkers.label}
        options={booleanSelectOptions.map((option) => ({
          ...option,
          nativeInputProps: {
            ...option.nativeInputProps,
            checked:
              Boolean(option.nativeInputProps.value) ===
              formValues.fitForDisabledWorkers,
            onChange: () => {
              setValue(
                "fitForDisabledWorkers",
                option.nativeInputProps.value === 1,
              );
            },
          },
        }))}
      />
      <Input
        label={formContents.website.label}
        hintText={formContents.website.hintText}
        nativeInputProps={{
          ...formContents.website,
          ...register("website"),
        }}
        {...getFieldError("website")}
      />
      <Input
        label={formContents.additionalInformation.label}
        hintText={formContents.additionalInformation.hintText}
        textArea
        nativeTextAreaProps={{
          ...formContents.additionalInformation,
          ...register("additionalInformation"),
        }}
        {...getFieldError("additionalInformation")}
      />

      <MultipleAppellationInput
        {...formContents.appellations}
        onAppellationAdd={(appellation, index) => {
          const appellationsToUpdate = formValues.appellations;
          appellationsToUpdate[index] = appellation;
          setValue("appellations", appellationsToUpdate);
        }}
        onAppellationDelete={(appellationIndex) => {
          const appellationsToUpdate = formValues.appellations;
          const newAppellations: AppellationAndRomeDto[] =
            appellationIndex === 0 && appellationsToUpdate.length === 1
              ? [emptyAppellationAndRome]
              : removeAtIndex(formValues.appellations, appellationIndex);
          setValue("appellations", newAppellations);
        }}
        currentAppellations={formValues.appellations}
        error={errors?.appellations?.message}
      />
      <MultipleAddressInput
        name="businessAddress"
        label={formContents.businessAddresses.label}
        hintText={`Par défaut, vous apparaîtrez dans les résultats de recherche liés à
        l’adresse de votre établissement. Vous pouvez ajouter d’autres adresses
        si vous proposez des immersions ailleurs. Par exemple : votre société
        est située à Dijon (adresse liée à votre SIRET) mais vous proposez une
        immersion dans votre antenne de Nantes.`}
        currentAddresses={formValues.businessAddresses}
        onAddressAdded={(address, index) => {
          const currentAddresses = formValues.businessAddresses;
          currentAddresses[index] = {
            id: uuidV4(),
            rawAddress: addressDtoToString(address),
          };
          setValue("businessAddresses", currentAddresses);
        }}
        onAddressDeleted={(index) => {
          const addresses = formValues.businessAddresses;
          const newAddresses =
            index === 0 && addresses.length === 1
              ? [
                  {
                    id: "",
                    rawAddress: "",
                  },
                ]
              : removeAtIndex(addresses, index);
          setValue("businessAddresses", newAddresses);
        }}
        id={domElementIds.establishment[mode].businessAddresses}
      />

      {keys(errors).length === 0 && keys(touchedFields).length > 0 && (
        <SearchResultPreview establishment={formValues} />
      )}
      <ErrorNotifications
        errorsWithLabels={toErrorsWithLabels({
          labels: formErrors,
          errors: displayReadableError(errors),
        })}
        visible={submitCount !== 0 && Object.values(errors).length > 0}
      />
      {feedback.kind === "submitErrored" && (
        <Alert
          severity="error"
          title="Erreur lors de l'envoi du formulaire de référencement d'entreprise"
          description={
            "Veuillez nous excuser. Un problème est survenu qui a compromis l'enregistrement de vos informations."
          }
        />
      )}
      {feedback.kind === "deleteErrored" && (
        <Alert
          severity="error"
          title="Erreur lors de la suppression"
          className={fr.cx("fr-mb-2w")}
          description="Veuillez nous excuser. Un problème est survenu lors de la suppression de l'entreprise."
        />
      )}

      {invalidEmailMessage !== null && (
        <Alert
          severity="error"
          title="Email invalide"
          className={fr.cx("fr-mb-2w")}
          description={`L'email de contact de l'entreprise a été invalidé par notre vérificateur d'email pour la raison suivante : ${invalidEmailMessage}`}
        />
      )}

      <ButtonsGroup
        inlineLayoutWhen="always"
        alignment="left"
        buttonsEquisized
        buttons={buttons}
      />
    </section>
  );
};
