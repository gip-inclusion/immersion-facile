import { useField } from "formik";
import React, { useEffect, useState } from "react";
import type { ConventionDto } from "shared";
import { AgencyId, AgencyOption } from "shared";
import { Loader } from "src/../../libs/react-design-system";
import { agencyGateway } from "src/config/dependencies";
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
  const name: keyof ConventionDto = "agencyId";
  const [{ value, onBlur }, { touched, error }, { setValue }] =
    useField<AgencyId>({ name });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
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
        setLoadingError(false);
      })
      .catch((e) => {
        //eslint-disable-next-line no-console
        console.log("AgencyDisplay", e);
        setAgencies([]);
        setLoadingError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const userError = touched && error;
  const showError = userError || loadingError;

  return (
    <div
      className={`fr-input-group${showError ? " fr-input-group--error" : ""}`}
    >
      <AgencyDropdownListField
        isLoading={isLoading}
        disabled={true}
        name={name}
        value={value}
        onBlur={onBlur}
        agencies={agencies}
        departmentCode={null}
        setValue={setValue}
      />
      {showError && (
        <AgencyErrorText
          loadingError={loadingError}
          userError={userError}
          error={error}
        />
      )}
      {isLoading && <Loader />}
    </div>
  );
};
