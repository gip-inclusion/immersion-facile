import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { AgencyId, AgencyOption, DepartmentCode } from "shared";
import { Agencies } from "src/app/components/agency/Agency";
import { useConventionTextsFromFormikContext } from "src/app/contents/forms/convention/textSetup";

export type AgencyDropdownListFieldProperties = {
  name: string;
  value: AgencyId;
  setValue: (value: AgencyId, shouldValidate?: boolean | undefined) => void;
  onBlur: React.FocusEventHandler<HTMLSelectElement> | undefined;
  disabled: boolean | undefined;
  isLoading: boolean;
  departmentCode: DepartmentCode | null;
  agencies: AgencyOption[];
};

export const AgencyDropdownListField = ({
  name,
  value,
  setValue,
  onBlur,
  disabled,
  isLoading,
  departmentCode,
  agencies,
}: AgencyDropdownListFieldProperties): JSX.Element => {
  const t = useConventionTextsFromFormikContext();
  return (
    <>
      <label className={fr.cx("fr-label", "fr-pt-1w")} htmlFor={name}>
        {`${t.agencySection.yourAgencyLabel} *`}
      </label>
      <select
        className={fr.cx("fr-select")}
        id={name}
        name={name}
        value={value}
        onChange={(evt) => {
          setValue(evt.currentTarget.value);
        }}
        onBlur={onBlur}
        aria-label="Choisissez votre structure"
        aria-describedby={`agency-code-{name}-error-desc-error`}
        disabled={disabled || isLoading || !departmentCode}
      >
        <Agencies agencies={agencies} />
      </select>
    </>
  );
};
