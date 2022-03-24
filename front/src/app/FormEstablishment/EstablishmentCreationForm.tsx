import { useField } from "formik";
import React, { useState } from "react";
import { formEstablishmentGateway } from "src/app/dependencies";
import { useFeatureFlagsContext } from "src/app/FeatureFlagContext";
import {
  EstablishmentForm,
  getLabelAndName,
  getMandatoryLabelAndName,
} from "src/app/FormEstablishment/EstablishmentForm";
import {
  useSiretFetcher,
  useSiretRelatedField,
} from "src/app/Siret/fetchEstablishmentInfoBySiret";
import { AddressAutocomplete } from "src/components/AddressAutocomplete";
import { Button } from "src/components/Button";
import { InfoMessage } from "src/components/form/InfoMessage";
import { SuccessMessage } from "src/components/form/SuccessMessage";
import { TextInput } from "src/components/form/TextInput";
import { ENV } from "src/environmentVariables";
import { OmitFromExistingKeys } from "src/shared/utils";
import {
  FormEstablishmentDto,
  FormEstablishmentSource,
} from "src/shared/formEstablishment/FormEstablishment.dto";

type EstablishmentCreationFormProps = {
  source: FormEstablishmentSource;
};

export const EstablishmentCreationForm = ({
  source,
}: EstablishmentCreationFormProps) => {
  const creationInitialValues = {
    ...creationInitialValuesWithoutSource,
    source,
  };
  return (
    <EstablishmentForm
      initialValues={creationInitialValues}
      saveForm={async (data) => {
        await formEstablishmentGateway.addFormEstablishment(data);
      }}
    >
      <CreationSiretRelatedInputs />
    </EstablishmentForm>
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
  const featureFlags = useFeatureFlagsContext();

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
        disabled={!featureFlags.enableByPassInseeApi}
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
  },
};

const creationInitialValuesWithoutSource: OmitFromExistingKeys<
  FormEstablishmentDto,
  "source"
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
      },
    };
