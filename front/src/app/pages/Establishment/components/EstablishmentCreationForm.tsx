import { useField } from "formik";
import React, { useState } from "react";
import { establishmentGateway } from "src/app/config/dependencies";
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
} from "shared/src/formEstablishment/FormEstablishment.dto";
import { SiretDto } from "shared/src/siret";
import { OmitFromExistingKeys } from "shared/src/utils";
import { AddressAutocomplete } from "src/uiComponents/AddressAutocomplete";
import { Button } from "src/uiComponents/Button";
import { InfoMessage } from "src/uiComponents/form/InfoMessage";
import { SuccessMessage } from "src/uiComponents/form/SuccessMessage";
import { TextInput } from "src/uiComponents/form/TextInput";
import { defaultInitialValue } from "./defaultInitialValue";
import {
  EstablishmentFormikForm,
  getLabelAndName,
  getMandatoryLabelAndName,
} from "./EstablishmentFormikForm";

type EstablishmentCreationFormProps = {
  source: FormEstablishmentSource;
  siret?: SiretDto;
};

export const EstablishmentCreationForm = ({
  source,
  siret,
}: EstablishmentCreationFormProps) => {
  const creationInitialValues = {
    ...creationInitialValuesWithoutSourceAndSearchable(siret),
    source,
    isSearchable: true,
  };

  return (
    <EstablishmentFormikForm
      initialValues={creationInitialValues}
      saveForm={async (data) => {
        await establishmentGateway.addFormEstablishment(data);
      }}
    >
      <CreationSiretRelatedInputs />
    </EstablishmentFormikForm>
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
              establishmentGateway
                .requestEstablishmentModification(siret)
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

// Should be handled by Unit Test Suites
const creationInitialValuesWithoutSourceAndSearchable = (
  siret?: SiretDto,
): OmitFromExistingKeys<FormEstablishmentDto, "source" | "isSearchable"> =>
  !ENV.PREFILLED_ESTABLISHMENT_FORM
    ? defaultInitialValue(siret)
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
