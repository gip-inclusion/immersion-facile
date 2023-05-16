import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { addDays, addMonths } from "date-fns";
import {
  addressDtoToString,
  ConventionReadDto,
  DateIntervalDto,
  isStringDate,
  reasonableSchedule,
  scheduleWithFirstDayActivity,
  toDateString,
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
  const formContents = getFormFields();
  const defaultDateMax = isStringDate(values.dateStart)
    ? new Date(values.dateStart)
    : new Date();
  const [dateMax, setDateMax] = useState(
    addMonths(defaultDateMax, 1).toISOString(),
  );
  const resetSchedule = (interval: DateIntervalDto) => {
    setValue(
      "schedule",
      values.schedule.isSimple
        ? reasonableSchedule(interval)
        : scheduleWithFirstDayActivity(interval),
    );
  };
  const getFieldError = makeFieldError(formState);
  const establishmentInfos = useAppSelector(siretSelectors.establishmentInfos);
  const isFetchingSiret = useAppSelector(siretSelectors.isFetching);

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
        disabled={isFetchingSiret}
      />
    </>
  );
};
