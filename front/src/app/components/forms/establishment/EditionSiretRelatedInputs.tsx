import { Input } from "@codegouvfr/react-dsfr/Input";
import React from "react";
import { useFormContext } from "react-hook-form";
import { addressDtoToString } from "shared";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import { getFormContents } from "src/app/hooks/formContents.hooks";

type EditionSiretRelatedInputsProps = {
  businessAddress: string;
};

export const EditionSiretRelatedInputs = ({
  businessAddress,
}: EditionSiretRelatedInputsProps) => {
  const { getFormFields } = getFormContents(formEstablishmentFieldsLabels);
  const formContents = getFormFields();
  const { register, setValue } = useFormContext();
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
        nativeInputProps={{
          ...register("businessName"),
          readOnly: true,
        }}
      />
      <Input
        {...formContents.businessNameCustomized}
        nativeInputProps={{
          ...register("businessNameCustomized"),
        }}
      />
      <AddressAutocomplete
        initialSearchTerm={businessAddress}
        {...formContents.businessAddress}
        setFormValue={({ address }) =>
          setValue("businessAddress", addressDtoToString(address))
        }
      />
    </>
  );
};
