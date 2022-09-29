import { useField } from "formik";
import React, { useState } from "react";
import { Button, Notification } from "react-design-system/immersionFacile";
import {
  addressDtoToString,
  FormEstablishmentDto,
  FormEstablishmentSource,
  OmitFromExistingKeys,
  SiretDto,
} from "shared";
import { establishmentGateway } from "src/app/config/dependencies";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { ENV } from "src/environmentVariables";
import {
  useInitialSiret,
  useSiretFetcher,
  useSiretRelatedField,
} from "src/hooks/siret.hooks";
import { AddressAutocomplete } from "src/uiComponents/autocomplete/AddressAutocomplete";

import {
  TextInput,
  TextInputControlled,
} from "src/uiComponents/form/TextInput";
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

  useSiretRelatedField("businessName");
  useSiretRelatedField("businessAddress");
  useSiretRelatedField("naf");
  const featureFlags = useFeatureFlags();

  const businessLabelAndName = getMandatoryLabelAndName("businessAddress");

  const [_, __, { setValue: setAddressValue }] = useField<string>(
    businessLabelAndName.name,
  );

  return (
    <>
      <TextInputControlled
        {...getMandatoryLabelAndName("siret")}
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
        <Notification type="success" title="Succès de la demande">
          Succès. Un mail a été envoyé au référent de cet établissement avec un
          lien permettant la mise à jour des informations.
        </Notification>
      )}
      {requestEmailToEditFormError && (
        <>
          <Notification
            type="info"
            title="La demande de modification n'a pas aboutie."
          >
            {requestEmailToEditFormError}
          </Notification>
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
        initialSearchTerm={establishmentInfos?.businessAddress}
        label={businessLabelAndName.label}
        setFormValue={({ address }) =>
          setAddressValue(addressDtoToString(address))
        }
        disabled={isFetchingSiret}
      />
    </>
  );
};

// Should be handled by Unit Test Suites
const creationInitialValuesWithoutSourceAndSearchable = (
  siret?: SiretDto,
): OmitFromExistingKeys<FormEstablishmentDto, "source" | "isSearchable"> =>
  !ENV.PREFILLED_FORMS
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
