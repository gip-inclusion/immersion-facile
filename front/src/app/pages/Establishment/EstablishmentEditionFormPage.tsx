import { useField } from "formik";
import React from "react";
import {
  addressDtoToString,
  EstablishmentJwtPayload,
  FormEstablishmentDto,
} from "shared";
import { MainWrapper } from "react-design-system";
import { establishmentGateway } from "src/app/config/dependencies";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
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
}) => {
  const onSaveForm =
    (
      route: Route<typeof routes.editFormEstablishment>,
    ): ((establishment: FormEstablishmentDto) => Promise<void>) =>
    (data) =>
      establishmentGateway.updateFormEstablishment(
        { ...data },
        route.params.jwt,
      );
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <ApiDataContainer
          callApi={() =>
            establishmentGateway.getFormEstablishmentFromJwt(
              decodeJwt<EstablishmentJwtPayload>(route.params.jwt).siret,
              route.params.jwt,
            )
          }
          jwt={route.params.jwt}
        >
          {(formEstablishment) =>
            !formEstablishment ? (
              <p>Données de formulaire d'établissement indisponibles</p>
            ) : !route.params.jwt ? (
              <p>Lien non valide</p>
            ) : (
              <EstablishmentFormikForm
                initialValues={formEstablishment}
                saveForm={onSaveForm(route)}
                isEditing
              >
                <EditionSiretRelatedInputs
                  businessAddress={formEstablishment.businessAddress}
                />
              </EstablishmentFormikForm>
            )
          }
        </ApiDataContainer>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

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
