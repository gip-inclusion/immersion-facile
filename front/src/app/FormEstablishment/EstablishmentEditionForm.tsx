import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { formEstablishmentGateway } from "src/app/dependencies";
import { defaultInitialValue } from "src/app/FormEstablishment/EstablishmentCreationForm";
import {
  EstablishmentForm,
  getLabelAndName,
  getMandatoryLabelAndName,
} from "src/app/FormEstablishment/EstablishmentForm";
import { routes } from "src/app/routes";
import { AddressAutocomplete } from "src/components/AddressAutocomplete";
import { TextInput } from "src/components/form/TextInput";
import { FormEstablishmentDto } from "src/shared/FormEstablishmentDto";
import { Route } from "type-route";

export const EstablishmentEditionForm = ({
  route,
}: {
  route: Route<typeof routes.editFormEstablishment>;
}) => {
  const [initialValues, setInitialValues] = useState<FormEstablishmentDto>({
    source: "immersion-facile",
    ...defaultInitialValue,
  });

  useEffect(() => {
    if (!route.params.jwt) return;
    formEstablishmentGateway
      .getFormEstablishmentFromJwt(route.params.jwt)
      .then((savedValues) =>
        setInitialValues({ ...initialValues, ...savedValues }),
      );
  }, [route.params.jwt]);

  if (!route.params.jwt) {
    return <p>Lien non valide</p>;
  }

  return (
    <EstablishmentForm
      initialValues={initialValues}
      saveForm={(data) =>
        formEstablishmentGateway.updateFormEstablishment(
          {
            ...data,
          },
          route.params.jwt,
        )
      }
    >
      <EditionSiretRelatedInputs
        businessAddress={initialValues.businessAddress}
      />
    </EstablishmentForm>
  );
};

const EditionSiretRelatedInputs = ({
  businessAddress,
}: {
  businessAddress: string;
}) => {
  const businessLabelAndName = getMandatoryLabelAndName("businessAddress");
  const [_, __, { setValue: setAddressValue }] = useField<string>(
    businessLabelAndName.name,
  );

  return (
    <>
      <TextInput {...getMandatoryLabelAndName("siret")} disabled={true} />

      <TextInput {...getMandatoryLabelAndName("businessName")} />
      <TextInput {...getLabelAndName("businessNameCustomized")} />
      <AddressAutocomplete
        initialSearchTerm={businessAddress}
        label={businessLabelAndName.label}
        setFormValue={(address) => setAddressValue(address.label)}
      />
    </>
  );
};
