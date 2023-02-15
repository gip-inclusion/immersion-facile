import { useField } from "formik";
import React, { useState, useEffect } from "react";
import { Button } from "react-design-system";
import {
  addressDtoToString,
  FormEstablishmentDto,
  FormEstablishmentSource,
  OmitFromExistingKeys,
  SiretDto,
} from "shared";
import { establishmentGateway } from "src/config/dependencies";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { ENV } from "src/config/environmentVariables";
import {
  useInitialSiret,
  useSiretFetcher,
  useSiretRelatedField,
} from "src/app/hooks/siret.hooks";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";

import {
  TextInput,
  TextInputControlled,
} from "src/app/components/forms/commons/TextInput";
import { defaultInitialValue } from "./defaultInitialValue";
import { EstablishmentFormikForm } from "./EstablishmentFormikForm";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

type EstablishmentCreationFormProps = {
  source: FormEstablishmentSource;
  siret?: SiretDto;
};

export const EstablishmentCreationForm = ({
  source,
  siret,
}: EstablishmentCreationFormProps) => {
  useInitialSiret(siret);
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
  const {
    currentSiret,
    establishmentInfos,
    isFetchingSiret,
    siretErrorToDisplay,
    siretRawError,
    updateSiret,
  } = useSiretFetcher({ shouldFetchEvenIfAlreadySaved: false });
  const [requestEmailToEditFormSucceed, setRequestEmailToEditFormSucceed] =
    useState(false);

  const [requestEmailToEditFormError, setRequestEmailToEditFormError] =
    useState<string | null>(null);
  const { getFormFields } = useFormContents(formEstablishmentFieldsLabels);
  const formContents = getFormFields();
  useSiretRelatedField("businessName");
  useSiretRelatedField("businessAddress");
  useSiretRelatedField("naf");
  const featureFlags = useFeatureFlags();

  const [_, __, { setValue: setAddressValue }] = useField<string>(
    formContents.businessAddress.name,
  );
  useEffect(() => () => updateSiret(""), []);
  return (
    <>
      <TextInputControlled
        {...formContents.siret}
        value={currentSiret}
        setValue={updateSiret}
        error={siretErrorToDisplay}
        placeholder="362 521 879 00034"
        disabled={isFetchingSiret}
      />
      {siretRawError === "Establishment with this siret is already in our DB" &&
        !requestEmailToEditFormSucceed && (
          <div>
            Cette entreprise a déjà été référencée.
            <Button
              disable={requestEmailToEditFormSucceed}
              id="im-form-add-establishment__edit-establishment-button"
              onSubmit={() => {
                establishmentGateway
                  .requestEstablishmentModification(currentSiret)
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
        <Alert
          severity="success"
          title="Succès de la demande"
          description="Succès. Un mail a été envoyé au référent de cet établissement avec un
        lien permettant la mise à jour des informations."
        />
      )}
      {requestEmailToEditFormError && (
        <>
          <Alert
            severity="info"
            title="La demande de modification n'a pas aboutie."
            description={requestEmailToEditFormError}
          />
        </>
      )}

      <TextInput
        {...formContents.businessName}
        readOnly={featureFlags.enableInseeApi}
      />
      <TextInput
        {...formContents.businessNameCustomized}
        disabled={isFetchingSiret}
      />
      <AddressAutocomplete
        initialSearchTerm={establishmentInfos?.businessAddress}
        {...formContents.businessAddress}
        setFormValue={({ address }) =>
          setAddressValue(addressDtoToString(address))
        }
        id="autocomplete-address-creation-establishment-form"
        disabled={isFetchingSiret}
      />
    </>
  );
};

// Should be handled by Unit Test Suites
const creationInitialValuesWithoutSourceAndSearchable = (
  siret?: SiretDto,
): OmitFromExistingKeys<FormEstablishmentDto, "source" | "isSearchable"> =>
  !ENV.prefilledForms
    ? defaultInitialValue(siret)
    : {
        siret: "1234567890123",
        website: "www@boucherie.fr/immersions",
        additionalInformation: "Végétariens, s'abstenir !",
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
