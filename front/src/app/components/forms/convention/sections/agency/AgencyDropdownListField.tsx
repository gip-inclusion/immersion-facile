import { CircularProgress } from "@mui/material";
import React from "react";
import { AgencyId, AgencyOption, DepartmentCode } from "shared";
import { Agencies } from "src/app/components/agency/Agency";
import { useConventionTextsFromFormikContext } from "src/app/contents/convention/textSetup";

export type AgencyDropdownListFieldProperties = {
  isLoading: boolean;
  name: string;
  value: AgencyId;
  setValue: (value: AgencyId, shouldValidate?: boolean | undefined) => void;
  onBlur: React.FocusEventHandler<HTMLSelectElement> | undefined;
  disabled: boolean | undefined;
  loaded: boolean;
  departmentCode: DepartmentCode | null;
  agencies: AgencyOption[];
};

export const AgencyDropdownListField = ({
  isLoading,
  name,
  value,
  setValue,
  onBlur,
  disabled,
  loaded,
  departmentCode,
  agencies,
}: AgencyDropdownListFieldProperties): JSX.Element => {
  const t = useConventionTextsFromFormikContext();
  return (
    <>
      <label className="fr-label pt-4" htmlFor={name}>
        {`${t.agencySection.yourAgencyLabel} *`}
      </label>
      <div className="flex">
        {isLoading && (
          <div className="flex justify-center items-center pr-2">
            <CircularProgress size="20px" />{" "}
          </div>
        )}
        <select
          className="fr-select"
          id={name}
          name={name}
          value={value}
          onChange={(evt) => {
            setValue(evt.currentTarget.value);
          }}
          onBlur={onBlur}
          aria-label="Choisissez votre structure"
          aria-describedby={`agency-code-{name}-error-desc-error`}
          disabled={disabled || !loaded || !departmentCode}
        >
          <Agencies agencies={agencies} />
        </select>
      </div>
    </>
  );
};
