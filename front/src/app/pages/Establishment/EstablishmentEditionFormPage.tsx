import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { formEstablishmentGateway } from "src/app/config/dependencies";
import { useFeatureFlagsContext } from "src/app/utils/FeatureFlagContext";
import { defaultInitialValue } from "./EstablishmentCreationForm";
import {
  EstablishmentFormPage,
  getLabelAndName,
  getMandatoryLabelAndName,
} from "./EstablishmentFormPage";
import { routes } from "src/app/routing/routes";
import { AddressAutocomplete } from "src/uiComponents/AddressAutocomplete";
import { TextInput } from "src/uiComponents/form/TextInput";
import { FormEstablishmentDto } from "src/shared/formEstablishment/FormEstablishment.dto";
import { Route } from "type-route";

export const EstablishmentEditionFormPage = ({
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
    <EstablishmentFormPage
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
    </EstablishmentFormPage>
  );
};

const EditionSiretRelatedInputs = ({
  businessAddress,
}: {
  businessAddress: string;
}) => {
  const featureFlags = useFeatureFlagsContext();
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
