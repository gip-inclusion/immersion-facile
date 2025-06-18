import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import type { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons, {
  type RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import { equals } from "ramda";
import { useState } from "react";
import { HeadingSection } from "react-design-system";
import { type UseFormRegisterReturn, useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type EstablishmentSearchableBy,
  type FormEstablishmentDto,
  domElementIds,
  immersionFacileContactEmail,
  toDateUTCString,
  toDisplayedDate,
} from "shared";
import {
  booleanSelectOptions,
  richBooleanSelectOptions,
} from "src/app/contents/forms/common/values";
import {
  formEstablishmentFieldsLabels,
  mailtoHref,
} from "src/app/contents/forms/establishment/formEstablishment";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { useAdminToken } from "src/app/hooks/jwt.hooks";
import { useRoute } from "src/app/routes/routes";
import { establishmentSlice } from "src/core-logic/domain/establishment/establishment.slice";
import allUsersSvg from "../../../../../assets/img/all.svg";
import jobSeekerSvg from "../../../../../assets/img/jobseeker.svg";
import studentSvg from "../../../../../assets/img/student.svg";
import type {
  Mode,
  OnStepChange,
  RouteByMode,
  Step,
} from "../EstablishmentForm";

const searchableByValues: Record<
  "all" | keyof EstablishmentSearchableBy,
  EstablishmentSearchableBy
> = {
  all: {
    jobSeekers: true,
    students: true,
  },
  jobSeekers: {
    jobSeekers: true,
    students: false,
  },
  students: {
    jobSeekers: false,
    students: true,
  },
};

export const OffersSettingsSection = ({
  onStepChange,
  currentStep,
  mode,
  availableForImmersion: availableForImmersionInProps,
  setAvailableForImmersion,
  shouldUpdateAvailability,
}: {
  onStepChange: OnStepChange;
  currentStep: Step;
  mode: Mode;
  availableForImmersion: boolean | undefined;
  setAvailableForImmersion: (value: boolean) => void;
  shouldUpdateAvailability: boolean | undefined;
}) => {
  const { setValue, watch, clearErrors, getValues, register, formState } =
    useFormContext<FormEstablishmentDto>();
  const adminJwt = useAdminToken();
  const route = useRoute() as RouteByMode[Mode];
  const isEstablishmentAdmin = route.name === "manageEstablishmentAdmin";

  const dispatch = useDispatch();
  const isStepMode = currentStep !== null;

  const formContents = getFormContents(
    formEstablishmentFieldsLabels(mode),
  ).getFormFields();
  const getFieldError = makeFieldError(formState);

  const [currentStepSubmitted, setCurrentStepSubmitted] = useState(false);

  const showErrorOnAvailableForImmersion = () => {
    if (currentStepSubmitted) {
      if (availableForImmersionInProps === undefined) return true;
      if (availableForImmersionInProps && getFieldError("maxContactsPerMonth"))
        return true;
      if (
        availableForImmersionInProps === false &&
        (getFieldError("nextAvailabilityDate") ||
          getFieldError("maxContactsPerMonth"))
      )
        return true;
    }
    return false;
  };

  const shouldShowErrorOnAvailableForImmersion =
    showErrorOnAvailableForImmersion();

  const currentNextAvailabilityDate = getValues("nextAvailabilityDate");

  const currentValueFormatted =
    currentNextAvailabilityDate &&
    toDateUTCString(new Date(currentNextAvailabilityDate));

  const searchableByOptions: RadioButtonsProps["options"] = [
    {
      label: "Tout le monde (publics scolaires et non-scolaires)",
      illustration: <img src={allUsersSvg} alt="" />,
      nativeInputProps: {
        value: "all",
        defaultChecked: true,
      },
    },
    {
      label:
        "Uniquement des publics non-scolaires qui ont un projet professionnel",
      illustration: <img src={jobSeekerSvg} alt="" />,
      nativeInputProps: {
        value: "jobSeekers",
      },
    },
    {
      label: "Uniquement des publics scolaires",
      illustration: <img src={studentSvg} alt="" />,
      nativeInputProps: {
        value: "students",
      },
    },
  ];

  const isAvailableForImmersion = () => {
    if (availableForImmersionInProps !== undefined)
      return availableForImmersionInProps;
    if (mode === "create" || shouldUpdateAvailability) return undefined;
    if (currentNextAvailabilityDate === undefined) return true;
    if (currentNextAvailabilityDate < new Date().toISOString())
      return undefined;
    return false;
  };

  const onClickEstablishmentDeleteButton = () => {
    const confirmed = confirm(
      `! Etes-vous sûr de vouloir supprimer cet établissement ? !
                (cette opération est irréversible 💀)`,
    );
    if (confirmed && adminJwt)
      dispatch(
        establishmentSlice.actions.deleteEstablishmentRequested({
          establishmentDelete: {
            siret: formValues.siret,
            jwt: adminJwt,
          },
          feedbackTopic: "form-establishment",
        }),
      );
    if (confirmed && !adminJwt) alert("Vous n'êtes pas admin.");
  };

  const availableForImmersion = isAvailableForImmersion();
  const formValues = getValues();

  return (
    <>
      <HeadingSection
        title="Disponibilité"
        description="Êtes-vous disponible actuellement pour recevoir des personnes en immersion ?"
      >
        <RadioButtons
          id={domElementIds.establishment[mode].availabilityButton}
          name="availableForImmersion"
          options={richBooleanSelectOptions.map((option) => ({
            ...option,
            nativeInputProps: {
              ...option.nativeInputProps,
              checked:
                Boolean(option.nativeInputProps.value) ===
                availableForImmersion,
              onChange: () => {
                const isAvailable = option.nativeInputProps.value === 1;
                clearErrors("nextAvailabilityDate");
                clearErrors("maxContactsPerMonth");
                setAvailableForImmersion(isAvailable);
                if (isAvailable) {
                  setValue("nextAvailabilityDate", undefined);
                }
              },
            },
          }))}
          state={shouldShowErrorOnAvailableForImmersion ? "error" : "default"}
          stateRelatedMessage={
            shouldShowErrorOnAvailableForImmersion
              ? "Veuillez remplir ce champ"
              : null
          }
        />

        {availableForImmersion === false && (
          <Input
            label={formContents.nextAvailabilityDate.label}
            nativeInputProps={{
              id: formContents.nextAvailabilityDate.id,
              defaultValue: currentValueFormatted,
              required: true,
              onBlur: (event) => {
                setValue(
                  "nextAvailabilityDate",
                  new Date(event.currentTarget.value).toISOString(),
                  {
                    shouldValidate: true,
                  },
                );
              },
              onChange: () => {},
              type: "date",
              min: toDateUTCString(new Date()),
            }}
            {...getFieldError("nextAvailabilityDate")}
          />
        )}
        {availableForImmersion !== undefined && (
          <Input
            label={
              availableForImmersion
                ? formContents.maxContactsPerMonth.label
                : formContents.maxContactsPerMonthWhenAvailable.label
            }
            nativeInputProps={{
              ...formContents.maxContactsPerMonth,
              ...register("maxContactsPerMonth", {
                valueAsNumber: true,
              }),
              type: "number",
              min: 1,
              pattern: "\\d*",
            }}
            {...getFieldError("maxContactsPerMonth")}
          />
        )}
        {mode === "admin" && (
          <Alert
            severity="info"
            title="Actuellement"
            description={
              <p>
                Mise en relation max/mois :{" "}
                <span
                  id={
                    domElementIds.establishment.admin.maxContactsPerMonthValue
                  }
                >
                  {getValues().maxContactsPerMonth}
                </span>{" "}
                <br />
                Prochaine disponibilité :{" "}
                {currentNextAvailabilityDate ? (
                  <>
                    à partir du{" "}
                    <span
                      id={
                        domElementIds.establishment.admin
                          .nextAvailabilityDateValue
                      }
                    >
                      {toDisplayedDate({
                        date: new Date(currentNextAvailabilityDate),
                      })}
                    </span>
                  </>
                ) : (
                  "tout le temps"
                )}
              </p>
            }
            small={true}
          />
        )}
        {availableForImmersion === false && mode === "edit" && (
          <div className={fr.cx("fr-highlight", "fr-ml-0")}>
            <p>
              Vous pouvez demander la suppression définitive de votre entreprise{" "}
              <a href={mailtoHref(getValues().siret)}>en cliquant ici</a>.{" "}
              <br />
              Si vous avez besoin d'aide, envoyez un email à{" "}
              <a href={mailtoHref(immersionFacileContactEmail)}>
                {immersionFacileContactEmail}
              </a>
              .
            </p>
          </div>
        )}
      </HeadingSection>

      <HeadingSection
        title="Type de candidats"
        description="Quelle catégorie de public souhaitez-vous recevoir en immersion ?"
      >
        <RadioButtons
          name="searchableBy"
          id={domElementIds.establishment[mode].searchableBy}
          options={searchableByOptions.map((option) => ({
            ...option,
            nativeInputProps: {
              ...option.nativeInputProps,
              checked: equals(
                watch("searchableBy"),
                searchableByValues[
                  option.nativeInputProps
                    .value as keyof typeof searchableByValues
                ],
              ),
              onChange: (event) => {
                const value = event.target.value;
                setValue(
                  "searchableBy",
                  searchableByValues[value as keyof typeof searchableByValues],
                );
              },
            },
          }))}
        />

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
        <HeadingSection title="Moyen de contact">
          <RadioButtons
            id={domElementIds.establishment[mode].contactMode}
            {...register("contactMode")}
            options={preferredContactModeOptions(register("contactMode"))}
            {...getFieldError("contactMode")}
          />
        </HeadingSection>
        {isStepMode && (
          <ButtonsGroup
            inlineLayoutWhen="always"
            alignment="left"
            buttonsEquisized
            buttons={[
              {
                children: "Étape précédente",
                onClick: () => onStepChange(2, []),
                iconId: "fr-icon-arrow-left-line",
                priority: "secondary",
                id: domElementIds.establishment[
                  mode
                ].previousButtonFromStepAndMode({
                  currentStep,
                  mode,
                }),
              },
              {
                children: "Étape suivante",
                onClick: () => {
                  setCurrentStepSubmitted(true);
                  return onStepChange(4, [
                    "searchableBy",
                    "maxContactsPerMonth",
                    "nextAvailabilityDate",
                    "isEngagedEnterprise",
                    "fitForDisabledWorkers",
                    "contactMode",
                  ]);
                },
                iconId: "fr-icon-arrow-right-line",
                iconPosition: "right",
                type: "button",
                id: domElementIds.establishment[mode].nextButtonFromStepAndMode(
                  {
                    currentStep,
                    mode,
                  },
                ),
              },
            ]}
          />
        )}
        {!isStepMode && (
          <ButtonsGroup
            inlineLayoutWhen="always"
            alignment="left"
            buttonsEquisized
            buttons={[
              {
                children: "Enregistrer les modifications",
                iconId: "fr-icon-save-line",
                priority: "primary",
                type: "submit",
                id: domElementIds.establishment[mode].submitFormButton,
              },
              ...(isEstablishmentAdmin
                ? [
                    {
                      children: "Supprimer l'établissement",
                      iconId: "fr-icon-delete-bin-line",
                      priority: "secondary",
                      type: "button",
                      onClick: onClickEstablishmentDeleteButton,
                      id: domElementIds.admin.manageEstablishment
                        .submitDeleteButton,
                    } satisfies ButtonProps,
                  ]
                : []),
            ]}
          />
        )}
      </HeadingSection>
    </>
  );
};

const preferredContactModeOptions = (
  register: UseFormRegisterReturn<string>,
): RadioButtonsProps["options"] => [
  {
    label:
      "Par mail (la demande passera par un formulaire afin de ne pas exposer l'adresse mail)",
    nativeInputProps: {
      value: "EMAIL",
      ...register,
    },
  },
  {
    label:
      "Par téléphone (seuls les candidats identifiés auront accès au numéro de téléphone)",
    nativeInputProps: {
      value: "PHONE",
      ...register,
    },
  },
  {
    label: "Se présenter en personne à votre établissement",
    nativeInputProps: {
      value: "IN_PERSON",
      ...register,
    },
  },
];
