import { useFormikContext } from "formik";
import React from "react";
import {
  ConventionDto,
  conventionObjectiveOptions,
} from "shared/src/convention/convention.dto";
import {
  emptySchedule,
  reasonableSchedule,
} from "shared/src/schedule/ScheduleUtils";
import { addressDtoToString } from "src/../../shared/src/utils/address";
import {
  BoolRadioGroup,
  RadioGroupForField,
} from "src/app/components/RadioGroup";
import { ConventionFormProfession } from "src/app/pages/Convention/ConventionFormProfession";
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
  const { setFieldValue, values } = useFormikContext<ConventionDto>();
  const establishmentInfos = useAppSelector(siretSelectors.establishmentInfos);
  const isFetchingSiret = useAppSelector(siretSelectors.isFetching);
  const isSiretFetcherDisabled = values.status !== "DRAFT";
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
        label="Date de début de l'immersion *"
        name="dateStart"
        type="date"
        disabled={disabled}
        onDateChange={(dateStart) => {
          resetSchedule(dateStart, values.dateEnd);
          setFieldValue("dateStart", dateStart);
        }}
      />
      <br />
      <DateInput
        label="Date de fin de l'immersion *"
        name="dateEnd"
        type="date"
        disabled={disabled}
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
        label="Conditions de travail, propres  au métier observé pendant l’immersion. "
        name="workConditions"
        description="Ex : transport de marchandises longue distance - pas de retour au domicile pendant 2 jours"
        disabled={disabled}
      />
      <br />
      <AddressAutocomplete
        initialSearchTerm={
          values.immersionAddress ?? establishmentInfos?.businessAddress
        }
        label="Adresse du lieu où se fera l'immersion * "
        setFormValue={({ address }) =>
          setFieldValue("immersionAddress", addressDtoToString(address))
        }
        disabled={disabled || isFetchingSiret}
      />
      <br />
      <BoolRadioGroup
        name="individualProtection"
        label="Un équipement de protection individuelle est-il fourni pour l’immersion ? *"
        disabled={disabled}
      />
      <BoolRadioGroup
        name="sanitaryPrevention"
        label="Des mesures de prévention sanitaire sont-elles prévues pour l’immersion ? *"
        disabled={disabled}
      />
      <TextInput
        label="Si oui, précisez-les"
        name="sanitaryPreventionDescription"
        type="text"
        placeholder=""
        description="Ex : fourniture de gel, de masques"
        disabled={disabled}
      />
      <RadioGroupForField
        name="immersionObjective"
        label="Objet de la période de mise en situation en milieu professionnel *"
        options={conventionObjectiveOptions.map((value) => ({
          value,
        }))}
        disabled={disabled}
      />
      <ConventionFormProfession
        label="Intitulé du poste / métier observé pendant l'immersion *"
        description="Ex : employé libre service, web développeur, boulanger …"
        disabled={disabled}
        initialFieldValue={values.immersionAppellation}
      />
      <TextInput
        label="Activités observées / pratiquées pendant l'immersion *"
        name="immersionActivities"
        type="text"
        placeholder=""
        description="Ex : mise en rayon, accueil et aide à la clientèle"
        disabled={disabled}
      />
      <TextInput
        label="Compétences/aptitudes observées / évaluées pendant l'immersion"
        name="immersionSkills"
        type="text"
        placeholder=""
        description="Ex : communiquer à l'oral, résoudre des problèmes, travailler en équipe"
        disabled={disabled}
      />
    </>
  );
};
