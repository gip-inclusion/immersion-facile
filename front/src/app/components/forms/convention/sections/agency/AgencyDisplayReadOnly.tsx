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

type AgencyDisplayProps = {
  agencyId?: string;
};

export const AgencyDisplayReadOnly = ({ agencyId }: AgencyDisplayProps) => {
  const name: keyof ConventionDto = "agencyId";
  const {
    getValues,
    setValue,
    formState: { errors, touchedFields },
  } = useFormContext<ConventionReadDto>();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
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
        setAgencies([{ ...agency }]);
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
        options={agencies.map(({ id, name }) => ({
          label: name,
          value: id,
        }))}
        nativeSelectProps={{
          ...formContents["agencyId"],
          value: agencyId,
        }}
        disabled={true}
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
