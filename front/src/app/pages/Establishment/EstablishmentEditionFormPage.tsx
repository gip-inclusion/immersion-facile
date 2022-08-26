import { useField } from "formik";
import React from "react";
import { EstablishmentJwtPayload } from "shared/src/tokens/MagicLinkPayload";
import { addressDtoToString } from "src/../../shared/src/utils/address";
import { establishmentGateway } from "src/app/config/dependencies";
import { routes } from "src/app/routing/routes";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { AddressAutocomplete } from "src/uiComponents/autocomplete/AddressAutocomplete";
import { TextInput } from "src/uiComponents/form/TextInput";
import { Route } from "type-route";
import { ApiDataContainer } from "../admin/ApiDataContainer";
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
      establishmentGateway.getFormEstablishmentFromJwt(
        decodeJwt<EstablishmentJwtPayload>(route.params.jwt).siret,
        route.params.jwt,
      )
    }
    jwt={route.params.jwt}>
    {(formEstablishment) => {
      if (!formEstablishment)
        return <p>Données de formulaire d'établissement indisponibles</p>;
      if (!route.params.jwt) {
        return <p>Lien non valide</p>;
      }
      return (
        <EstablishmentFormikForm
          initialValues={formEstablishment}
          saveForm={(data) =>
            establishmentGateway.updateFormEstablishment(
              { ...data },
              route.params.jwt,
            )
          }
          isEditing>
          <EditionSiretRelatedInputs
            businessAddress={formEstablishment.businessAddress}
          />
        </EstablishmentFormikForm>
      );
    }}
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
        setFormValue={({ address }) =>
          setAddressValue(addressDtoToString(address))
        }
      />
    </>
  );
};
