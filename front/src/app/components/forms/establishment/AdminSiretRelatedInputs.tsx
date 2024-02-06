import { Input } from "@codegouvfr/react-dsfr/Input";
import React from "react";
import { useFormContext } from "react-hook-form";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import { getFormContents } from "src/app/hooks/formContents.hooks";

export const AdminSiretRelatedInputs = () => {
  const { getFormFields } = getFormContents(formEstablishmentFieldsLabels);
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
          readOnly: true,
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
        {...formContents.businessAddresses}
        setFormValue={() => undefined}
      />
    </>
  );
};
