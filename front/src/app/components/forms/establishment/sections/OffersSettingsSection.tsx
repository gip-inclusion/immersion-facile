import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import RadioButtons, {
  type RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import { equals } from "ramda";

import Alert from "@codegouvfr/react-dsfr/Alert";
import Input from "@codegouvfr/react-dsfr/Input";
import { type UseFormRegisterReturn, useFormContext } from "react-hook-form";
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
import allUsersSvg from "../../../../../assets/img/all.svg";
import jobSeekerSvg from "../../../../../assets/img/jobseeker.svg";
import studentSvg from "../../../../../assets/img/student.svg";
import type { Mode, OnStepChange, Step } from "../EstablishmentForm";
import { EstablishmentFormSection } from "../EstablishmentFormSection";

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
  const isStepMode = currentStep !== null;

  const formContents = getFormContents(
    formEstablishmentFieldsLabels(mode),
  ).getFormFields();
  const getFieldError = makeFieldError(formState);

  const shouldShowErrorOnAvailableForImmersion =
    availableForImmersionInProps === undefined &&
    (getFieldError("maxContactsPerMonth") ||
      getFieldError("nextAvailabilityDate"));

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

  const availableForImmersion = isAvailableForImmersion();
  const formValues = getValues();

  return (
    <>
      <EstablishmentFormSection
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
        {availableForImmersion !== undefined &&
          (mode === "edit" || mode === "admin") && (
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
      </EstablishmentFormSection>

      <EstablishmentFormSection
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
        <EstablishmentFormSection title="Moyen de contact">
          <RadioButtons
            id={domElementIds.establishment[mode].contactMode}
            {...register("contactMode")}
            options={preferredContactModeOptions(register("contactMode"))}
            {...getFieldError("contactMode")}
          />
        </EstablishmentFormSection>
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
                onClick: () =>
                  onStepChange(4, [
                    "searchableBy",
                    "maxContactsPerMonth",
                    "nextAvailabilityDate",
                    "isEngagedEnterprise",
                    "fitForDisabledWorkers",
                    "contactMode",
                  ]),
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
      </EstablishmentFormSection>
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
