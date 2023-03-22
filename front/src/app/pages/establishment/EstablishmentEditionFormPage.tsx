import React from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { MainWrapper, PageHeader } from "react-design-system";
import { useFormContext } from "react-hook-form";
import {
  addressDtoToString,
  decodeMagicLinkJwtWithoutSignatureCheck,
  EstablishmentJwtPayload,
  FormEstablishmentDto,
} from "shared";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { routes } from "src/app/routes/routes";
import { establishmentGateway } from "src/config/dependencies";
import { Route } from "type-route";
import { ApiDataContainer } from "../admin/ApiDataContainer";

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
      <MainWrapper
        layout="boxed"
        pageHeader={
          <PageHeader
            title="Éditer une entreprise référencée"
            centered
            theme="establishment"
          />
        }
      >
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
              <EstablishmentForm
                initialValues={formEstablishment}
                saveForm={onSaveForm(route)}
                isEditing
              >
                <EditionSiretRelatedInputs
                  businessAddress={formEstablishment.businessAddress}
                />
              </EstablishmentForm>
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
  const { getFormFields } = useFormContents(formEstablishmentFieldsLabels);
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
          readOnly: featureFlags.enableInseeApi,
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
