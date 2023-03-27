import { Select } from "@codegouvfr/react-dsfr/Select";
import React, { useEffect, useState } from "react";
import { Loader } from "react-design-system";
import { useFormContext } from "react-hook-form";
import type { ConventionDto, ConventionReadDto } from "shared";
import { AgencyOption } from "shared";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { agencyGateway } from "src/config/dependencies";
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
  const {
    register,
    getValues,
    setValue,
    formState: { errors, touchedFields },
  } = useFormContext<ConventionReadDto>();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [agencies, setAgencies] = useState([placeholderAgency]);
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(getValues().internshipKind),
  );
  const formContents = getFormFields();
  const error = errors[name];
  const touched = touchedFields[name];
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
          setValue(name, agencyId);
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
          ...register(name),
          onChange: (event) => setValue(name, event.currentTarget.value),
        }}
      />

      {showError && (
        <AgencyErrorText
          loadingError={loadingError}
          userError={userError?.message}
          error={error?.message}
        />
      )}
      {isLoading && <Loader />}
    </div>
  );
};
