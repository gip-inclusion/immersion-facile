import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";

export const AdminSiretRelatedInputs = () => {
  const featureFlags = useFeatureFlags();
  const { getFormFields } = useFormContents(formEstablishmentFieldsLabels);
  const formContents = getFormFields();
  const { register } = useFormContext();
  return (
    <>
      <Input
        {...formContents.siret}
        disabled={true}
        nativeInputProps={{
          ...register("siret"),
        }}
      />
      <Input
        {...formContents.businessName}
        disabled={true}
        nativeInputProps={{
          ...register("businessName"),
          readOnly: featureFlags.enableInseeApi.isActive,
        }}
      />
      <Input
        {...formContents.businessNameCustomized}
        disabled={true}
        nativeInputProps={{
          ...register("businessNameCustomized"),
        }}
      />
      <AddressAutocomplete
        initialSearchTerm={""}
        disabled={true}
        {...formContents.businessAddress}
        setFormValue={() => undefined}
      />
    </>
  );
};
