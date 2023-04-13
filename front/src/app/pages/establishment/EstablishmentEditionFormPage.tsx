import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Route } from "type-route";

import {
  addressDtoToString,
  decodeMagicLinkJwtWithoutSignatureCheck,
  EstablishmentJwtPayload,
  FormEstablishmentDto,
} from "shared";

import { Loader, MainWrapper, PageHeader } from "react-design-system";

import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { routes } from "src/app/routes/routes";
import { establishmentGateway } from "src/config/dependencies";

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
  const [formInitialValues, setFormInitialValues] =
    useState<FormEstablishmentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const formEstablishmentInitialValues =
      establishmentGateway.getFormEstablishmentFromJwt(
        decodeMagicLinkJwtWithoutSignatureCheck<EstablishmentJwtPayload>(
          route.params.jwt,
        ).siret,
        route.params.jwt,
      );
    formEstablishmentInitialValues
      .then((formEstablishment) => {
        setFormInitialValues(formEstablishment);
      })
      .catch((error) =>
        routes
          .errorRedirect({
            kind: error.kind,
            message: error.message,
            title:
              "Problème lors de la récupération des données de l'entreprise",
          })
          .push(),
      )
      .finally(() => setIsLoading(false));
  }, []);
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
        {isLoading && <Loader />}
        {!isLoading && formInitialValues && (
          <EstablishmentForm
            initialValues={formInitialValues}
            saveForm={onSaveForm(route)}
            isEditing
          >
            <EditionSiretRelatedInputs
              businessAddress={formInitialValues.businessAddress}
            />
          </EstablishmentForm>
        )}
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
