import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { addDays, addMonths, differenceInDays } from "date-fns";
import {
  addressDtoToString,
  ConventionReadDto,
  DateIntervalDto,
  isStringDate,
  maximumCalendarDayByInternshipKind,
  reasonableSchedule,
  scheduleWithFirstDayActivity,
  toDateString,
  Weekday,
} from "shared";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import {
  makeFieldError,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { AddressAutocomplete } from "../../../autocomplete/AddressAutocomplete";
import { SchedulePicker } from "../../../commons/SchedulePicker/SchedulePicker";

export const ImmersionHourLocationSection = () => {
  const { setValue, getValues, register, formState } =
    useFormContext<ConventionReadDto>();
  const values = getValues();
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const [dateStartInputValue, setDateStartInputValue] = useState<string>(
    values.dateStart,
  );
  const [dateEndInputValue, setDateEndInputValue] = useState<string>(
    values.dateEnd,
  );
  const formContents = getFormFields();
  const defaultDateMax = isStringDate(values.dateStart)
    ? new Date(values.dateStart)
    : new Date();
  const [dateMax, setDateMax] = useState(
    addMonths(defaultDateMax, 1).toISOString(),
  );
  const excludedDays =
    values.internshipKind === "mini-stage-cci"
      ? (["dimanche"] as Weekday[])
      : [];
  const resetSchedule = () => {
    const interval: DateIntervalDto = {
      start: new Date(values.dateStart),
      end: new Date(values.dateEnd),
    };
    setValue(
      "schedule",
      values.schedule.isSimple
        ? reasonableSchedule(interval, excludedDays, [])
        : scheduleWithFirstDayActivity(interval, excludedDays),
    );
  };
  const getFieldError = makeFieldError(formState);
  const establishmentInfos = useAppSelector(siretSelectors.establishmentInfos);
  const isFetchingSiret = useAppSelector(siretSelectors.isFetching);

  const shouldUpdateDateAndSchedule = (dateStart: string, dateEnd: string) =>
    differenceInDays(new Date(dateEnd), new Date(dateStart)) <=
    maximumCalendarDayByInternshipKind[values.internshipKind];

  const onDateInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name } = event.target;
    const newDates: DateIntervalDto = {
      start: new Date(dateStartInputValue),
      end: new Date(dateEndInputValue),
    };
    const isDateEndAfterDateStart =
      differenceInDays(newDates.end, newDates.start) > 0;

    if (!isDateEndAfterDateStart && name === "dateStart") {
      newDates.end = addDays(newDates.start, 1);
    }

    if (!isDateEndAfterDateStart && name === "dateEnd") {
      newDates.start = addDays(newDates.end, -1);
    }

    if (
      !shouldUpdateDateAndSchedule(
        newDates.start.toISOString(),
        newDates.end.toISOString(),
      )
    ) {
      alert(
        `Attention, votre ${
          values.internshipKind === "immersion" ? "immersion" : "stage"
        } ne peut pas dépasser ${
          maximumCalendarDayByInternshipKind[values.internshipKind]
        } jours. Veuillez modifier les dates de votre ${
          values.internshipKind === "immersion" ? "immersion" : "stage"
        }.`,
      );
      return;
    }

    setDateMax(addMonths(newDates.start, 1).toISOString());
    setValue("dateEnd", newDates.end.toISOString());
    setValue("dateStart", newDates.start.toISOString());
    setDateStartInputValue(newDates.start.toISOString());
    setDateEndInputValue(newDates.end.toISOString());
    resetSchedule();
  };

  return (
    <>
      {values.internshipKind === "mini-stage-cci" && (
        <>
          <Alert
            small
            severity="info"
            className={fr.cx("fr-mb-4w")}
            description="La présente convention est signée pour la durée de la période d’observation en milieu professionnel, qui ne peut dépasser 5 jours sur une période de vacances scolaires fixée annuellement par le Ministère de l’éducation nationale. La durée de la présence hebdomadaire des jeunes en milieu professionnel ne peut excéder 30 heures pour les jeunes de moins de 15 ans et 35 heures pour les jeunes de 15 ans et plus, répartis sur 5 jours maximum. Plusieurs stages sont possibles pour un même jeune pendant l’année, sous réserve d’observer des métiers différents et de ne pas dépasser la moitié de chaque période de vacances scolaires."
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
        nativeInputProps={{
          name: register("dateStart").name,
          ref: register("dateStart").ref,
          id: formContents["dateStart"].id,
          value: toDateString(new Date(dateStartInputValue)),
          onChange: (event) => {
            const dateStart = event.target.value;
            if (dateStart !== "" && isStringDate(dateStart)) {
              setDateStartInputValue(new Date(dateStart).toISOString());
            }
          },
          onBlur: onDateInputBlur,
          type: "date",
        }}
        {...getFieldError("dateStart")}
      />
      <Input
        label={formContents["dateEnd"].label}
        hintText={formContents["dateEnd"].hintText}
        nativeInputProps={{
          name: register("dateEnd").name,
          ref: register("dateEnd").ref,
          id: formContents["dateEnd"].id,
          onChange: (event) => {
            const dateEnd = event.target.value;
            if (dateEnd !== "" && isStringDate(dateEnd)) {
              setDateEndInputValue(new Date(dateEnd).toISOString());
            }
          },
          type: "date",
          max: dateMax,
          value: toDateString(new Date(dateEndInputValue)),
          onBlur: onDateInputBlur,
        }}
        {...getFieldError("dateEnd")}
      />

      <SchedulePicker
        interval={{
          start: new Date(values.dateStart),
          end: new Date(values.dateEnd),
        }}
        excludedDays={excludedDays}
      />
      <AddressAutocomplete
        {...formContents["immersionAddress"]}
        initialSearchTerm={
          values.immersionAddress ?? establishmentInfos?.businessAddress
        }
        setFormValue={({ address }) =>
          setValue("immersionAddress", addressDtoToString(address))
        }
        disabled={isFetchingSiret}
      />
    </>
  );
};
