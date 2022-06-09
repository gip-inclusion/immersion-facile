import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { establishmentGateway } from "src/app/config/dependencies";
import { routes } from "src/app/routing/routes";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { AddressAutocomplete } from "src/uiComponents/AddressAutocomplete";
import { TextInput } from "src/uiComponents/form/TextInput";
import { Route } from "type-route";
import { ApiDataContainer } from "../admin/ApiDataContainer";
import { defaultInitialValue } from "./components/defaultInitialValue";
import {
  EstablishmentFormikForm,
  getLabelAndName,
  getMandatoryLabelAndName,
} from "./components/EstablishmentFormikForm";

export const EstablishmentEditionFormPage = ({
  route,
}: {
  route: Route<typeof routes.editFormEstablishment>;
}) => (
  <ApiDataContainer
    callApi={() =>
      establishmentGateway.getFormEstablishmentFromJwt(route.params.jwt)
    }
    jwt={route.params.jwt}
  >
    {(formEstablishment) => (
      <Form formEstablishment={formEstablishment} route={route} />
    )}
  </ApiDataContainer>
);

const EditionSiretRelatedInputs = ({
  businessAddress,
}: {
  businessAddress: string;
}) => {
  const featureFlags = useFeatureFlags();
  const businessLabelAndName = getMandatoryLabelAndName("businessAddress");
  const [_, __, { setValue: setAddressValue }] = useField<string>(
    businessLabelAndName.name,
  );

  return (
    <>
      <TextInput {...getMandatoryLabelAndName("siret")} disabled={true} />

      <TextInput
        {...getMandatoryLabelAndName("businessName")}
        disabled={featureFlags.enableInseeApi}
      />
      <TextInput {...getLabelAndName("businessNameCustomized")} />
      <AddressAutocomplete
        initialSearchTerm={businessAddress}
        label={businessLabelAndName.label}
        setFormValue={(address) => setAddressValue(address.label)}
      />
    </>
  );
};

type FormProps = {
  formEstablishment: FormEstablishmentDto | null;
  route: Route<typeof routes.editFormEstablishment>;
};

const Form = ({ formEstablishment, route }: FormProps) => {
  const [formEstablishmentState, setInitialValues] =
    useState<FormEstablishmentDto>({
      source: "immersion-facile",
      ...defaultInitialValue(),
    });

  useEffect(() => {
    if (formEstablishment) setInitialValues(formEstablishment);
  }, [route.params.jwt]);

  if (!route.params.jwt) {
    return <p>Lien non valide</p>;
  }

  return (
    <EstablishmentFormikForm
      initialValues={formEstablishmentState}
      saveForm={(data) =>
        establishmentGateway.updateFormEstablishment(
          { ...data },
          route.params.jwt,
        )
      }
      isEditing
    >
      <EditionSiretRelatedInputs
        businessAddress={formEstablishmentState.businessAddress}
      />
    </EstablishmentFormikForm>
  );
};
