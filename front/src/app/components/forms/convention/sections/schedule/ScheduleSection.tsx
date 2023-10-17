import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { addDays, differenceInDays } from "date-fns";
import {
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
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { SchedulePicker } from "../../../commons/SchedulePicker/SchedulePicker";

export const ScheduleSection = () => {
  const { setValue, watch, register, formState, reset } =
    useFormContext<
      Pick<
        ConventionReadDto,
        "dateStart" | "dateEnd" | "schedule" | "internshipKind" | "signatories"
      >
    >();
  const values = watch();

  const { getFormFields } = getFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );

  const formContents = getFormFields();

  const [dateMax, setDateMax] = useState(
    addDays(
      isStringDate(values.dateStart) ? new Date(values.dateStart) : new Date(),
      maximumCalendarDayByInternshipKind[values.internshipKind],
    ).toISOString(),
  );

  const excludedDays =
    values.internshipKind === "mini-stage-cci"
      ? (["dimanche"] as Weekday[])
      : [];

  const getFieldError = makeFieldError(formState);

  const shouldUpdateDateAndSchedule = (dateStart: string, dateEnd: string) =>
    differenceInDays(new Date(dateEnd), new Date(dateStart)) <=
    maximumCalendarDayByInternshipKind[values.internshipKind];

  const [dateStartInputValue, setDateStartInputValue] = useState<string>(
    values.dateStart,
  );
  const [dateEndInputValue, setDateEndInputValue] = useState<string>(
    values.dateEnd,
  );

  const onDateInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const inputName = event.target.name;
    if (inputValue !== "" && isStringDate(inputValue)) {
      const newDates: DateIntervalDto = {
        start: new Date(values.dateStart),
        end: new Date(values.dateEnd),
      };

      if (inputName === "dateStart") {
        newDates.start = new Date(inputValue);
        if (differenceInDays(newDates.end, newDates.start) <= 0)
          newDates.end = newDates.start;
      }

      if (inputName === "dateEnd") {
        newDates.end = new Date(inputValue);
        if (differenceInDays(newDates.end, newDates.start) <= 0)
          newDates.start = newDates.end;
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
          } jours. Nous avons donc ajusté la date de fin.`,
        );
        newDates.end = addDays(
          newDates.start,
          maximumCalendarDayByInternshipKind[values.internshipKind],
        );
      }

      setDateMax(
        addDays(
          newDates.start,
          maximumCalendarDayByInternshipKind[values.internshipKind],
        ).toISOString(),
      );
      setValue("dateStart", newDates.start.toISOString());
      setValue("dateEnd", newDates.end.toISOString());
      setValue(
        "schedule",
        values.schedule.isSimple
          ? reasonableSchedule(newDates, excludedDays, [])
          : scheduleWithFirstDayActivity(newDates, excludedDays),
      );
    }
  };

  useEffect(() => {
    reset(values);
  }, []);

  useEffect(() => {
    setDateStartInputValue(toDateString(new Date(values.dateStart)));
    setDateEndInputValue(toDateString(new Date(values.dateEnd)));
  }, [values.dateStart, values.dateEnd]);

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
          type: "date",
          name: register("dateStart").name,
          id: formContents["dateStart"].id,
          value: dateStartInputValue,
          onChange: (event) => {
            const dateStart = event.target.value;
            if (dateStart !== "" && isStringDate(dateStart)) {
              setDateStartInputValue(dateStart);
            }
          },
          onBlur: onDateInputBlur,
          min: toDateString(new Date("2022-01-01")),
        }}
        {...getFieldError("dateStart")}
      />
      <Input
        label={formContents["dateEnd"].label}
        hintText={formContents["dateEnd"].hintText}
        nativeInputProps={{
          type: "date",
          name: register("dateEnd").name,
          id: formContents["dateEnd"].id,
          value: dateEndInputValue,
          onChange: (event) => {
            const dateEnd = event.target.value;
            if (dateEnd !== "" && isStringDate(dateEnd)) {
              setDateEndInputValue(dateEnd);
            }
          },
          onBlur: onDateInputBlur,
          max: toDateString(new Date(dateMax)),
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
    </>
  );
};
