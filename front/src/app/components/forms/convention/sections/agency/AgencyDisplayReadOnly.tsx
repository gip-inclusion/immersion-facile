import { useField } from "formik";
import React, { useEffect, useState } from "react";
import type { ConventionDto } from "shared";
import { AgencyId, AgencyOption, DepartmentCode } from "shared";
import { agencyGateway } from "src/config/dependencies";
import { PostcodeAutocomplete } from "src/app/components/forms/commons/PostcodeAutocomplete";
import { useConventionTextsFromFormikContext } from "src/app/contents/forms/convention/textSetup";
import { AgencyDropdownListField } from "./AgencyDropdownListField";
import { AgencyErrorText } from "./AgencyErrorText";

const placeholderAgency: AgencyOption = {
  id: "",
  name: "Veuillez indiquer un code postal",
};
type AgencyDisplayProps = {
  agencyId?: string;
};

export const AgencyDisplayReadOnly = ({ agencyId }: AgencyDisplayProps) => {
  const t = useConventionTextsFromFormikContext();
  const name: keyof ConventionDto = "agencyId";
  const [{ value, onBlur }, { touched, error }, { setValue }] =
    useField<AgencyId>({ name });

  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [departmentCode, setDepartmentCode] = useState<DepartmentCode | null>(
    null,
  );
  const [agencies, setAgencies] = useState([placeholderAgency]);

  useEffect(() => {
    if (!agencyId) return;
    agencyGateway
      .getAgencyPublicInfoById({ id: agencyId })
      .then((agency) => {
        setAgencies([
          {
            id: "",
            name: "",
          },
          { ...agency },
        ]);
        if (agencyId && agencies.map((agency) => agency.id).includes(agencyId))
          setValue(agencyId);
        setLoaded(true);
        setLoadingError(false);
      })
      .catch((e) => {
        //eslint-disable-next-line no-console
        console.log("AgencyDisplay", e);
        setAgencies([]);
        setLoaded(false);
        setLoadingError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [departmentCode]);

  const userError = touched && error;
  const showError = userError || loadingError;

  return (
    <div
      className={`fr-input-group${showError ? " fr-input-group--error" : ""}`}
    >
      <PostcodeAutocomplete
        onFound={setDepartmentCode}
        disabled={true}
        label={t.agencySection.yourPostalcodeLabel}
      />
      <AgencyDropdownListField
        isLoading={isLoading}
        loaded={loaded}
        disabled={true}
        name={name}
        value={value}
        onBlur={onBlur}
        agencies={agencies}
        departmentCode={departmentCode}
        setValue={setValue}
      />
      {showError && (
        <AgencyErrorText
          loadingError={loadingError}
          userError={userError}
          error={error}
        />
      )}
    </div>
  );
};
