import { useField } from "formik";
import React, { useState } from "react";
import {
  FormEstablishmentDto,
  FormEstablishmentSource,
} from "shared/src/formEstablishment/FormEstablishment.dto";
import { SiretDto } from "shared/src/siret";
import { OmitFromExistingKeys } from "shared/src/utils";
import { establishmentGateway } from "src/app/config/dependencies";
import {
  useInitialSiret,
  useSiretFetcher,
  useSiretRelatedField,
} from "src/hooks/siret.hooks";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { ENV } from "src/environmentVariables";
import { Button, Notification } from "react-design-system/immersionFacile";

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
import { AddressAutocomplete } from "src/uiComponents/autocomplete/AddressAutocomplete";

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
    siretError,
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
        error={siretError}
        placeholder="362 521 879 00034"
        disabled={isFetchingSiret}
      />
      {siretError === "Establishment with this siret is already in our DB" &&
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
