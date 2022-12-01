import { addMonths } from "date-fns";
import { useFormikContext } from "formik";
import React, { useState } from "react";
import {
  addressDtoToString,
  ConventionDto,
  conventionObjectiveOptions,
  DateIntervalDto,
  getConventionFieldName,
  reasonableSchedule,
  scheduleWithFirstDayActivity,
} from "shared";
import { Notification } from "react-design-system";
import {
  BoolRadioGroup,
  RadioGroupForField,
} from "src/app/components/forms/commons/RadioGroup";
import { ConventionFormProfession } from "src/app/components/forms/convention/ConventionFormProfession";
import { useConventionTextsFromFormikContext } from "src/app/contents/convention/textSetup";
import { useAppSelector } from "src/hooks/reduxHooks";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { useSiretRelatedField } from "src/hooks/siret.hooks";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { DateInput } from "src/app/components/forms/commons/DateInput";
import { SchedulePicker } from "src/app/components/forms/commons/SchedulePicker/SchedulePicker";
import { TextInput } from "src/app/components/forms/commons/TextInput";

export const ImmersionConditionsCommonFields = ({
  disabled,
}: {
  disabled?: boolean;
}) => {
  const t = useConventionTextsFromFormikContext();
  const { setFieldValue, values } = useFormikContext<ConventionDto>();
  const establishmentInfos = useAppSelector(siretSelectors.establishmentInfos);
  const isFetchingSiret = useAppSelector(siretSelectors.isFetching);
  const isSiretFetcherDisabled = values.status !== "DRAFT";
  const [dateMax, setDateMax] = useState(
    addMonths(new Date(values.dateStart), 1).toISOString(),
  );
  useSiretRelatedField("businessName", {
    disabled: isSiretFetcherDisabled,
  });
  useSiretRelatedField("businessAddress", {
    fieldToUpdate: "immersionAddress",
    disabled: isSiretFetcherDisabled,
  });

  const resetSchedule = (interval: DateIntervalDto) => {
    setFieldValue(
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
          <Notification title="" type="info">
            La présente convention est signée pour la durée de la période
            d’observation en milieu professionnel, qui ne peut dépasser une
            semaine sur une période de vacances scolaires fixée annuellement par
            le Ministère de l’éducation nationale. La durée de la présence
            hebdomadaire des jeunes en milieu professionnel ne peut excéder 30
            heures pour les jeunes de moins de 15 ans et 35 heures pour les
            jeunes de 15 ans et plus répartis sur 5 jours.
          </Notification>
          <Notification title="Assurances" type="info">
            Afin de préparer au mieux les conditions de réalisation du stage,
            les signataires de la conventions s’engagent à avoir une couverture
            d’assurance suffisante tant pour les dommages pouvant être
            occasionnés par le jeune que pour les risques auxquels il peut être
            exposé.
          </Notification>
        </>
      )}
      <DateInput
        label={`${t.immersionConditionsSection.dateStartLabel} *`}
        name={getConventionFieldName("dateStart")}
        disabled={disabled}
        onDateChange={(dateStart) => {
          resetSchedule({
            start: new Date(dateStart),
            end: new Date(values.dateEnd),
          });
          setFieldValue("dateStart", dateStart);
          setDateMax(addMonths(new Date(dateStart), 1).toISOString());
        }}
      />
      <DateInput
        label={`${t.immersionConditionsSection.dateEndLabel} *`}
        name={getConventionFieldName("dateEnd")}
        disabled={disabled}
        max={dateMax}
        onDateChange={(dateEnd) => {
          resetSchedule({
            start: new Date(values.dateStart),
            end: new Date(dateEnd),
          });
          setFieldValue("dateEnd", dateEnd);
        }}
      />
      <SchedulePicker
        disabled={disabled}
        interval={{
          start: new Date(values.dateStart),
          end: new Date(values.dateEnd),
        }}
      />
      <TextInput
        label={t.immersionConditionsSection.workConditions.label}
        name={getConventionFieldName("workConditions")}
        description={t.immersionConditionsSection.workConditions.description}
        disabled={disabled}
      />
      <AddressAutocomplete
        initialSearchTerm={
          values.immersionAddress ?? establishmentInfos?.businessAddress
        }
        label={`${t.immersionConditionsSection.immersionAddressLabel} *`}
        setFormValue={({ address }) =>
          setFieldValue("immersionAddress", addressDtoToString(address))
        }
        disabled={disabled || isFetchingSiret}
      />
      <BoolRadioGroup
        name={getConventionFieldName("individualProtection")}
        label={`${t.immersionConditionsSection.individualProtectionLabel} *`}
        disabled={disabled}
      />
      {values.internshipKind === "mini-stage-cci" && (
        <Notification title="" type="info">
          En application des articles L 4153-8 et D 4153-15 et suivants du code
          du travail, relatif aux travaux interdits et règlementés, le jeune,
          s’il est mineur, ne peut accéder aux machines, appareils ou produits
          dont l’usage est proscrit aux mineurs. Il ne peut ni procéder à des
          manœuvres ou manipulations sur d’autres machines, produits ou
          appareils de production, ni effectuer les travaux légers autorisés aux
          mineurs par le même code.
        </Notification>
      )}
      <BoolRadioGroup
        name={getConventionFieldName("sanitaryPrevention")}
        label={`${t.immersionConditionsSection.sanitaryPreventionLabel} *`}
        disabled={disabled}
      />

      <TextInput
        label={t.immersionConditionsSection.sanitaryPreventionDetails.label}
        name={getConventionFieldName("sanitaryPreventionDescription")}
        type="text"
        placeholder=""
        description={
          t.immersionConditionsSection.sanitaryPreventionDetails.description
        }
        disabled={disabled}
      />
      {values.internshipKind === "mini-stage-cci" && (
        <Notification title="" type="info">
          De même, les parties signataires de la convention s’engagent à mettre
          en œuvre et respecter les consignes publiées par les services de
          l’Etat, notamment pour exemple celles concernant les mesures de
          prévention des risques de contamination en matière sanitaire.
        </Notification>
      )}
      <RadioGroupForField
        name={getConventionFieldName("immersionObjective")}
        label={`${t.immersionConditionsSection.immersionObjectiveLabel} *`}
        options={conventionObjectiveOptions
          .filter((value) =>
            values.internshipKind !== "mini-stage-cci"
              ? true
              : value !== "Initier une démarche de recrutement",
          )
          .map((value) => ({
            value,
          }))}
        disabled={disabled}
      />
      <ConventionFormProfession
        label={`${t.immersionConditionsSection.profession.label} *`}
        description={t.immersionConditionsSection.profession.description}
        disabled={disabled}
        initialFieldValue={values.immersionAppellation}
      />
      <TextInput
        label={`${t.immersionConditionsSection.immersionActivities.label} *`}
        name={getConventionFieldName("immersionActivities")}
        type="text"
        placeholder=""
        description={
          t.immersionConditionsSection.immersionActivities.description
        }
        disabled={disabled}
      />
      {values.internshipKind === "mini-stage-cci" && (
        <Notification title="" type="info">
          Durant la période d’observation, le jeune participe à des activités de
          l’entreprise, en liaison avec les objectifs précisés dans l’annexe
          pédagogique, sous le contrôle des personnels responsables de leur
          encadrement en milieu professionnel. Il est soumis aux règles
          générales en vigueur dans l’entreprise ou l’organisme d’accueil,
          notamment en matière de santé, sécurité, d’horaires et de discipline.
          Le jeune est tenu au respect du secret professionnel.
        </Notification>
      )}
      <TextInput
        label={`${t.immersionConditionsSection.immersionSkills.label}`}
        name={getConventionFieldName("immersionSkills")}
        type="text"
        placeholder=""
        description={t.immersionConditionsSection.immersionSkills.description}
        disabled={disabled}
      />
    </>
  );
};
