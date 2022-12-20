import { useField } from "formik";
import React from "react";
import {
  addressDtoToString,
  EstablishmentJwtPayload,
  FormEstablishmentDto,
} from "shared";
import { MainWrapper } from "react-design-system";
import { decodeMagicLinkJwtWithoutSignatureCheck } from "shared";
import { establishmentGateway } from "src/config/dependencies";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { Route } from "type-route";
import { ApiDataContainer } from "../admin/ApiDataContainer";
import {
  EstablishmentFormikForm,
  getLabelAndName,
  getMandatoryLabelAndName,
} from "src/app/components/forms/establishment/EstablishmentFormikForm";

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
              decodeMagicLinkJwtWithoutSignatureCheck<EstablishmentJwtPayload>(
                route.params.jwt,
              ).siret,
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
        readOnly={featureFlags.enableInseeApi}
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
