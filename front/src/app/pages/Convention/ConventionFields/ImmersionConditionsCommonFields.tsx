import { addMonths } from "date-fns";
import { useFormikContext } from "formik";
import React, { useState } from "react";
import { getConventionFieldName } from "shared";
import { ConventionDto, conventionObjectiveOptions } from "shared";
import { emptySchedule, reasonableSchedule } from "shared";
import { addressDtoToString } from "shared";
import {
  BoolRadioGroup,
  RadioGroupForField,
} from "src/app/components/RadioGroup";
import { ConventionFormProfession } from "src/app/pages/Convention/ConventionFormProfession";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { useSiretRelatedField } from "src/hooks/siret.hooks";
import { AddressAutocomplete } from "src/uiComponents/autocomplete/AddressAutocomplete";
import { DateInput } from "src/uiComponents/form/DateInput";
import { SchedulePicker } from "src/uiComponents/form/SchedulePicker/SchedulePicker";
import { TextInput } from "src/uiComponents/form/TextInput";

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

  const resetSchedule = (dateStart: string, dateEnd: string) => {
    const interval = {
      start: new Date(dateStart),
      end: new Date(dateEnd),
    };
    setFieldValue(
      "schedule",
      values.schedule.isSimple
        ? reasonableSchedule(interval)
        : emptySchedule(interval),
    );
  };
  return (
    <>
      <DateInput
        label={`${t.immersionConditionsCommonFields.dateStartLabel} *`}
        name={getConventionFieldName("dateStart")}
        disabled={disabled}
        onDateChange={(dateStart) => {
          resetSchedule(dateStart, values.dateEnd);
          setFieldValue("dateStart", dateStart);
          setDateMax(addMonths(new Date(dateStart), 1).toISOString());
        }}
      />
      <br />
      <DateInput
        label={`${t.immersionConditionsCommonFields.dateEndLabel} *`}
        name={getConventionFieldName("dateEnd")}
        disabled={disabled}
        max={dateMax}
        onDateChange={(dateEnd) => {
          resetSchedule(values.dateStart, dateEnd);
          setFieldValue("dateEnd", dateEnd);
        }}
      />
      <br />
      <SchedulePicker
        disabled={disabled}
        interval={{
          start: new Date(values.dateStart),
          end: new Date(values.dateEnd),
        }}
      />
      <br />
      <TextInput
        label={t.immersionConditionsCommonFields.workConditions.label}
        name={getConventionFieldName("workConditions")}
        description={
          t.immersionConditionsCommonFields.workConditions.description
        }
        disabled={disabled}
      />
      <br />
      <AddressAutocomplete
        initialSearchTerm={
          values.immersionAddress ?? establishmentInfos?.businessAddress
        }
        label={`${t.immersionConditionsCommonFields.immersionAddressLabel} *`}
        setFormValue={({ address }) =>
          setFieldValue("immersionAddress", addressDtoToString(address))
        }
        disabled={disabled || isFetchingSiret}
      />
      <br />
      <BoolRadioGroup
        name={getConventionFieldName("individualProtection")}
        label={`${t.immersionConditionsCommonFields.individualProtectionLabel} *`}
        disabled={disabled}
      />
      <BoolRadioGroup
        name={getConventionFieldName("sanitaryPrevention")}
        label={`${t.immersionConditionsCommonFields.sanitaryPreventionLabel} *`}
        disabled={disabled}
      />
      <TextInput
        label={
          t.immersionConditionsCommonFields.sanitaryPreventionDetails.label
        }
        name={getConventionFieldName("sanitaryPreventionDescription")}
        type="text"
        placeholder=""
        description={
          t.immersionConditionsCommonFields.sanitaryPreventionDetails
            .description
        }
        disabled={disabled}
      />
      <RadioGroupForField
        name={getConventionFieldName("immersionObjective")}
        label={`${t.immersionConditionsCommonFields.immersionObjectiveLabel} *`}
        options={conventionObjectiveOptions.map((value) => ({
          value,
        }))}
        disabled={disabled}
      />
      <ConventionFormProfession
        label={`${t.immersionConditionsCommonFields.profession.label} *`}
        description={t.immersionConditionsCommonFields.profession.description}
        disabled={disabled}
        initialFieldValue={values.immersionAppellation}
      />
      <TextInput
        label={`${t.immersionConditionsCommonFields.immersionActivities.label} *`}
        name={getConventionFieldName("immersionActivities")}
        type="text"
        placeholder=""
        description={
          t.immersionConditionsCommonFields.immersionActivities.description
        }
        disabled={disabled}
      />
      <TextInput
        label={`${t.immersionConditionsCommonFields.immersionSkills.label}`}
        name={getConventionFieldName("immersionSkills")}
        type="text"
        placeholder=""
        description={
          t.immersionConditionsCommonFields.immersionSkills.description
        }
        disabled={disabled}
      />
    </>
  );
};
