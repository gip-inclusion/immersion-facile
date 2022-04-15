import { useField } from "formik";
import React, { useState } from "react";
import { formEstablishmentGateway } from "src/app/config/dependencies";
import {
  useSiretFetcher,
  useSiretRelatedField,
} from "src/app/utils/fetchEstablishmentInfoBySiret";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { featureFlagsSelector } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { ENV } from "src/environmentVariables";
import {
  FormEstablishmentDto,
  FormEstablishmentSource,
} from "src/shared/formEstablishment/FormEstablishment.dto";
import { OmitFromExistingKeys } from "src/shared/utils";
import { AddressAutocomplete } from "src/uiComponents/AddressAutocomplete";
import { Button } from "src/uiComponents/Button";
import { InfoMessage } from "src/uiComponents/form/InfoMessage";
import { SuccessMessage } from "src/uiComponents/form/SuccessMessage";
import { TextInput } from "src/uiComponents/form/TextInput";
import {
  EstablishmentFormPage,
  getLabelAndName,
  getMandatoryLabelAndName,
} from "./EstablishmentFormPage";

type EstablishmentCreationFormProps = {
  source: FormEstablishmentSource;
};

export const EstablishmentCreationForm = ({
  source,
}: EstablishmentCreationFormProps) => {
  const creationInitialValues = {
    ...creationInitialValuesWithoutSourceAndSearchable,
    source,
    isSearchable: true,
  };

  return (
    <EstablishmentFormPage
      initialValues={creationInitialValues}
      saveForm={async (data) => {
        await formEstablishmentGateway.addFormEstablishment(data);
      }}
    >
      <CreationSiretRelatedInputs />
    </EstablishmentFormPage>
  );
};

const CreationSiretRelatedInputs = () => {
  const { siret, establishmentInfo, isFetchingSiret, siretAlreadyExists } =
    useSiretFetcher({ fetchSirenApiEvenAlreadyInDb: false, disabled: false });

  const [requestEmailToEditFormSucceed, setRequestEmailToEditFormSucceed] =
    useState(false);

  const [requestEmailToEditFormError, setRequestEmailToEditFormError] =
    useState<string | null>(null);

  useSiretRelatedField("businessName", establishmentInfo);
  useSiretRelatedField("businessAddress", establishmentInfo);
  useSiretRelatedField("naf", establishmentInfo);
  const featureFlags = useAppSelector(featureFlagsSelector);

  const businessLabelAndName = getMandatoryLabelAndName("businessAddress");

  const [_, __, { setValue: setAddressValue }] = useField<string>(
    businessLabelAndName.name,
  );

  return (
    <>
      <TextInput
        {...getMandatoryLabelAndName("siret")}
        placeholder="362 521 879 00034"
        disabled={isFetchingSiret}
      />
      {siretAlreadyExists && !requestEmailToEditFormSucceed && (
        <div>
          Cette entreprise a déjà été référencée.
          <Button
            disable={requestEmailToEditFormSucceed}
            onSubmit={() => {
              formEstablishmentGateway
                .requestEmailToEditForm(siret)
                .then(() => {
                  setRequestEmailToEditFormSucceed(true);
                })
                .catch((err) => {
                  setRequestEmailToEditFormError(err.response.data.errors);
                });
            }}
          >
            Demande de modification du formulaire de référencement
          </Button>
        </div>
      )}
      {requestEmailToEditFormSucceed && (
        <SuccessMessage title="Succès de la demande">
          Succès. Un mail a été envoyé au référent de cet établissement avec un
          lien permettant la mise à jour des informations.
        </SuccessMessage>
      )}
      {requestEmailToEditFormError && (
        <>
          <InfoMessage
            title="La demande de modification n'a pas aboutie."
            text={requestEmailToEditFormError}
          />
          <br />
        </>
      )}

      <TextInput
        {...getMandatoryLabelAndName("businessName")}
        disabled={featureFlags.enableInseeApi}
      />
      <TextInput
        {...getLabelAndName("businessNameCustomized")}
        disabled={isFetchingSiret}
      />
      <AddressAutocomplete
        initialSearchTerm={establishmentInfo?.businessAddress}
        label={businessLabelAndName.label}
        setFormValue={(address) => setAddressValue(address.label)}
        disabled={isFetchingSiret}
      />
    </>
  );
};

export const defaultInitialValue: OmitFromExistingKeys<
  FormEstablishmentDto,
  "source"
> = {
  siret: "",
  businessName: "",
  businessAddress: "",
  appellations: [],
  businessContact: {
    firstName: "",
    lastName: "",
    job: "",
    phone: "",
    email: "",
    contactMethod: "EMAIL",
    copyEmails: [],
  },
  isSearchable: true,
};

const creationInitialValuesWithoutSourceAndSearchable: OmitFromExistingKeys<
  FormEstablishmentDto,
  "source" | "isSearchable"
> = !ENV.dev
  ? defaultInitialValue
  : {
      siret: "1234567890123",
      businessName: "My business name, replaced by result from API",
      businessNameCustomized:
        "My Customized Business name, not replaced by API",
      businessAddress: "My business address, replaced by result from API",
      isEngagedEnterprise: true,
      appellations: [
        {
          appellationCode: "11573",
          romeCode: "D1102",
          romeLabel: "Boulangerie",
          appellationLabel: "Boulanger - Boulangère",
        },
        {
          appellationCode: "11564",
          romeCode: "D1101",
          romeLabel: "Boucherie",
          appellationLabel: "Boucher - Bouchère",
        },
      ],
      businessContact: {
        firstName: "John",
        lastName: "Doe",
        job: "super job",
        phone: "02837",
        email: "joe@mail.com",
        contactMethod: "EMAIL",
        copyEmails: ["recrutement@boucherie.net"],
      },
    };
