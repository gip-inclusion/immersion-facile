import { useField, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";
import type { ConventionDto } from "shared";
import { AgencyId, AgencyOption } from "shared";
import { Loader } from "react-design-system";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { agencyGateway } from "src/config/dependencies";
import { AgencyErrorText } from "./AgencyErrorText";
import { Select } from "@codegouvfr/react-dsfr/Select";

const placeholderAgency: AgencyOption = {
  id: "",
  name: "Veuillez indiquer un code postal",
};
type AgencyDisplayProps = {
  agencyId?: string;
};

export const AgencyDisplayReadOnly = ({ agencyId }: AgencyDisplayProps) => {
  const name: keyof ConventionDto = "agencyId";
  const [{ value }, { touched, error }, { setValue }] = useField<AgencyId>({
    name,
  });
  const { values } = useFormikContext<ConventionDto>();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [agencies, setAgencies] = useState([placeholderAgency]);
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();

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
      <Select
        {...formContents["agencyId"]}
        options={agencies.map(({ id, name }) => ({ label: name, value: id }))}
        placeholder={formContents["agencyId"].placeholder}
        nativeSelectProps={{
          ...formContents["agencyId"],
          onChange: (event) => setValue(event.currentTarget.value),
          value,
        }}
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
