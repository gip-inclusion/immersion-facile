import { Input } from "@codegouvfr/react-dsfr/Input";
import React from "react";
import { useFormContext } from "react-hook-form";
import { FormEstablishmentDto } from "shared";
import { Mode } from "src/app/components/forms/establishment/EstablishmentForm";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";

export const EditionSiretRelatedInputs = ({
  mode,
}: {
  mode: Mode;
}) => {
  const { getFormFields } = getFormContents(
    formEstablishmentFieldsLabels(mode),
  );
  const formContents = getFormFields();
  const { register } = useFormContext();

  const getFieldError = makeFieldError(
    useFormContext<FormEstablishmentDto>().formState,
  );

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
        label={formContents.businessName.label}
        nativeInputProps={{
          id: formContents.businessName.id,
          ...register("businessName"),
          readOnly: true,
        }}
      />
      <Input
        label={formContents.businessNameCustomized.label}
        nativeInputProps={{
          id: formContents.businessNameCustomized.id,
          ...register("businessNameCustomized", {
            setValueAs: (value) => (value ? value : undefined),
          }),
        }}
        {...getFieldError("businessNameCustomized")}
      />
    </>
  );
};
