import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { addDays, addMonths } from "date-fns";
import {
  addressDtoToString,
  conventionObjectiveOptions,
  ConventionReadDto,
  DateIntervalDto,
  isStringDate,
  reasonableSchedule,
  scheduleWithFirstDayActivity,
  toDateString,
} from "shared";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { SchedulePicker } from "src/app/components/forms/commons/SchedulePicker/SchedulePicker";
import { ConventionFormProfession } from "src/app/components/forms/convention/ConventionFormProfession";
import { booleanSelectOptions } from "src/app/contents/forms/common/values";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import {
  makeFieldError,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useSiretRelatedField } from "src/app/hooks/siret.hooks";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";

export const ImmersionConditionsCommonFields = ({
  disabled,
}: {
  disabled?: boolean;
}) => {
  const { setValue, getValues, register, formState } =
    useFormContext<ConventionReadDto>();
  const values = getValues();
  const establishmentInfos = useAppSelector(siretSelectors.establishmentInfos);
  const isFetchingSiret = useAppSelector(siretSelectors.isFetching);
  const isSiretFetcherDisabled = values.status !== "DRAFT";
  const defaultDateMax = isStringDate(values.dateStart)
    ? new Date(values.dateStart)
    : new Date();
  const [dateMax, setDateMax] = useState(
    addMonths(defaultDateMax, 1).toISOString(),
  );
  useSiretRelatedField("businessName", {
    disabled: isSiretFetcherDisabled,
  });
  useSiretRelatedField("businessAddress", {
    fieldToUpdate: "immersionAddress",
    disabled: isSiretFetcherDisabled,
  });
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const getFieldError = makeFieldError(formState);
  const formContents = getFormFields();

  const resetSchedule = (interval: DateIntervalDto) => {
    setValue(
      "schedule",
      values.schedule.isSimple
        ? reasonableSchedule(interval)
        : scheduleWithFirstDayActivity(interval),
    );
  };
  return (
    <>
      {values.internshipKind === "mini-stage-cci" && (
        <>
          <Alert
            small
            severity="info"
            className={fr.cx("fr-mb-4w")}
            description="La présente convention est signée pour la durée de la période
            d’observation en milieu professionnel, qui ne peut dépasser 5 jours sur une période de vacances scolaires fixée annuellement par
            le Ministère de l’éducation nationale. La durée de la présence
            hebdomadaire des jeunes en milieu professionnel ne peut excéder 30
            heures pour les jeunes de moins de 15 ans et 35 heures pour les
            jeunes de 15 ans et plus, répartis sur 5 jours maximum."
          />

          <Alert
            title="Assurances"
            severity="info"
            className={fr.cx("fr-mb-4w")}
            description="Afin de préparer au mieux les conditions de réalisation du stage,
            les signataires de la conventions s’engagent à avoir une couverture
            d’assurance suffisante tant pour les dommages pouvant être
            occasionnés par le jeune que pour les risques auxquels il peut être
            exposé."
          />
        </>
      )}
      <Input
        label={formContents["dateStart"].label}
        hintText={formContents["dateStart"].hintText}
        disabled={disabled}
        nativeInputProps={{
          name: register("dateStart").name,
          ref: register("dateStart").ref,
          id: formContents["dateStart"].id,
          value: toDateString(new Date(values.dateStart)),
          onChange: (event) => {
            const newDateStart = event.target.value;
            if (isStringDate(newDateStart) && newDateStart !== "") {
              setValue("dateStart", newDateStart, {
                shouldValidate: true,
              });
            }
          },
          onBlur: (event) => {
            const dateStart = event.target.value;
            if (isStringDate(dateStart) && dateStart !== "") {
              const newDateEnd = addDays(new Date(values.dateStart), 1);
              resetSchedule({
                start: new Date(dateStart),
                end: newDateEnd,
              });
              setValue("dateEnd", newDateEnd.toISOString(), {
                shouldValidate: true,
              });
              setDateMax(addMonths(new Date(dateStart), 1).toISOString());
            }
          },
          type: "date",
        }}
        {...getFieldError("dateStart")}
      />
      <Input
        label={formContents["dateEnd"].label}
        hintText={formContents["dateEnd"].hintText}
        disabled={disabled}
        nativeInputProps={{
          name: register("dateEnd").name,
          ref: register("dateEnd").ref,
          id: formContents["dateEnd"].id,
          onChange: (event) => {
            const newDateEnd = event.target.value;
            if (isStringDate(newDateEnd) && newDateEnd !== "") {
              setValue("dateEnd", newDateEnd, {
                shouldValidate: true,
              });
            }
          },
          onBlur: (event) => {
            const dateEnd = event.target.value;
            resetSchedule({
              start: new Date(values.dateStart),
              end: new Date(dateEnd),
            });
          },
          type: "date",
          max: dateMax,
          value: toDateString(new Date(values.dateEnd)),
        }}
        {...getFieldError("dateEnd")}
      />

      <SchedulePicker
        disabled={disabled}
        interval={{
          start: new Date(values.dateStart),
          end: new Date(values.dateEnd),
        }}
      />
      <AddressAutocomplete
        {...formContents["immersionAddress"]}
        initialSearchTerm={
          values.immersionAddress ?? establishmentInfos?.businessAddress
        }
        setFormValue={({ address }) =>
          setValue("immersionAddress", addressDtoToString(address))
        }
        disabled={disabled || isFetchingSiret}
      />
      <RadioButtons
        {...formContents["individualProtection"]}
        legend={formContents["individualProtection"].label}
        hintText={formContents["individualProtection"].hintText}
        options={booleanSelectOptions.map((option) => ({
          ...option,
          nativeInputProps: {
            ...option.nativeInputProps,
            checked:
              Boolean(option.nativeInputProps.value) ===
              values.individualProtection,
            onChange: () => {
              setValue(
                "individualProtection",
                option.nativeInputProps.value === 1,
              );
            },
          },
        }))}
        disabled={disabled}
      />

      {values.internshipKind === "mini-stage-cci" && (
        <Alert
          small
          severity="info"
          className={fr.cx("fr-mb-4w")}
          description="En application des articles L 4153-8 et D 4153-15 et suivants du code
        du travail, relatif aux travaux interdits et règlementés, le jeune,
        s’il est mineur, ne peut accéder aux machines, appareils ou produits
        dont l’usage est proscrit aux mineurs. Il ne peut ni procéder à des
        manœuvres ou manipulations sur d’autres machines, produits ou
        appareils de production, ni effectuer les travaux légers autorisés aux
        mineurs par le même code."
        />
      )}

      <RadioButtons
        {...formContents["sanitaryPrevention"]}
        legend={formContents["sanitaryPrevention"].label}
        hintText={formContents["sanitaryPrevention"].hintText}
        options={booleanSelectOptions.map((option) => ({
          ...option,
          nativeInputProps: {
            ...option.nativeInputProps,
            checked:
              Boolean(option.nativeInputProps.value) ===
              values.sanitaryPrevention,
            onChange: () => {
              setValue(
                "sanitaryPrevention",
                option.nativeInputProps.value === 1,
                {
                  shouldValidate: true,
                },
              );
            },
          },
        }))}
        disabled={disabled}
      />

      <Input
        label={formContents["sanitaryPreventionDescription"].label}
        hintText={formContents["sanitaryPreventionDescription"].hintText}
        nativeInputProps={{
          ...formContents["sanitaryPreventionDescription"],
          ...register("sanitaryPreventionDescription"),
        }}
        disabled={disabled}
      />
      {values.internshipKind === "mini-stage-cci" && (
        <Alert
          small
          severity="info"
          className={fr.cx("fr-mb-4w")}
          description="De même, les parties signataires de la convention s’engagent à mettre
        en œuvre et respecter les consignes publiées par les services de
        l’Etat, notamment pour exemple celles concernant les mesures de
        prévention des risques de contamination en matière sanitaire."
        />
      )}

      <RadioButtons
        {...formContents["immersionObjective"]}
        legend={formContents["immersionObjective"].label}
        hintText={formContents["immersionObjective"].hintText}
        options={conventionObjectiveOptions
          .filter((option) =>
            values.internshipKind !== "mini-stage-cci"
              ? true
              : option !== "Initier une démarche de recrutement",
          )
          .map((option) => ({
            value: option,
            label: option,
            nativeInputProps: {
              onChange: () => setValue("immersionObjective", option),
              checked: option === values.immersionObjective,
              value: option,
            },
          }))}
        disabled={disabled}
      />

      <ConventionFormProfession
        {...formContents["immersionAppellation"]}
        disabled={disabled}
        initialFieldValue={values.immersionAppellation}
      />
      <Input
        label={formContents["workConditions"].label}
        hintText={formContents["workConditions"].hintText}
        textArea
        nativeTextAreaProps={{
          ...formContents["workConditions"],
          ...register("workConditions"),
        }}
        disabled={disabled}
      />
      <Input
        label={formContents["businessAdvantages"].label}
        hintText={formContents["businessAdvantages"].hintText}
        textArea
        nativeTextAreaProps={{
          ...formContents["businessAdvantages"],
          ...register("businessAdvantages"),
        }}
        disabled={disabled}
      />
      <Input
        label={formContents["immersionActivities"].label}
        hintText={formContents["immersionActivities"].hintText}
        textArea
        nativeTextAreaProps={{
          ...formContents["immersionActivities"],
          ...register("immersionActivities"),
        }}
        disabled={disabled}
      />
      {values.internshipKind === "mini-stage-cci" && (
        <Alert
          small
          severity="info"
          className={fr.cx("fr-mb-4w")}
          description="Durant la période d’observation, le jeune participe à des activités de
        l’entreprise, en liaison avec les objectifs précisés dans l’annexe
        pédagogique, sous le contrôle des personnels responsables de leur
        encadrement en milieu professionnel. Il est soumis aux règles
        générales en vigueur dans l’entreprise ou l’organisme d’accueil,
        notamment en matière de santé, sécurité, d’horaires et de discipline.
        Le jeune est tenu au respect du secret professionnel."
        />
      )}
      <Input
        label={formContents["immersionSkills"].label}
        hintText={formContents["immersionSkills"].hintText}
        nativeInputProps={{
          ...formContents["immersionSkills"],
          ...register("immersionSkills"),
        }}
        disabled={disabled}
      />
    </>
  );
};
