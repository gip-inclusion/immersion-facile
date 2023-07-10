import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import {
  addressDtoToString,
  domElementIds,
  FormEstablishmentDto,
} from "shared";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { establishmentGateway } from "src/config/dependencies";

export const CreationSiretRelatedInputs = () => {
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
  const {
    setValue,
    register,
    formState: { touchedFields },
  } = useFormContext<FormEstablishmentDto>();
  const [requestEmailToEditFormError, setRequestEmailToEditFormError] =
    useState<string | null>(null);
  const { getFormFields } = useFormContents(formEstablishmentFieldsLabels);
  const formContents = getFormFields();

  useEffect(() => {
    if (isFetchingSiret) return;
    setValue(
      "businessName",
      establishmentInfos ? establishmentInfos.businessName : "",
    );
    setValue(
      "businessAddress",
      establishmentInfos ? establishmentInfos.businessAddress : "",
    );
    setValue("naf", establishmentInfos ? establishmentInfos.nafDto : undefined);
  }, [establishmentInfos]);

  const featureFlags = useFeatureFlags();

  return (
    <>
      <Input
        label={formContents.siret.label}
        hintText={formContents.siret.hintText}
        nativeInputProps={{
          ...formContents.siret,
          ...register("siret"),
          onChange: (event) => {
            updateSiret(event.target.value);
            setValue("siret", event.target.value);
          },
        }}
        state={siretErrorToDisplay && touchedFields.siret ? "error" : "default"}
        stateRelatedMessage={
          touchedFields.siret && siretErrorToDisplay ? siretErrorToDisplay : ""
        }
        disabled={isFetchingSiret}
      />
      {siretRawError === "Establishment with this siret is already in our DB" &&
        !requestEmailToEditFormSucceed && (
          <div>
            Cette entreprise a déjà été référencée.
            <Button
              onClick={() => {
                establishmentGateway
                  .requestEstablishmentModification(currentSiret)
                  .then(() => {
                    setRequestEmailToEditFormSucceed(true);
                  })
                  .catch((err) => {
                    setRequestEmailToEditFormError(err.response.data.errors);
                  });
              }}
              nativeButtonProps={{
                disabled: requestEmailToEditFormSucceed,
                id: domElementIds.establishment.errorSiretAlreadyExistButton,
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
        <Alert
          severity="info"
          title="La demande de modification n'a pas aboutie."
          description={requestEmailToEditFormError}
        />
      )}
      <Input
        label={formContents.businessName.label}
        hintText={formContents.businessName.hintText}
        nativeInputProps={{
          ...formContents.businessName,
          ...register("businessName"),
          readOnly: featureFlags.enableInseeApi,
        }}
      />
      <Input
        label={formContents.businessNameCustomized.label}
        hintText={formContents.businessNameCustomized.hintText}
        nativeInputProps={{
          ...formContents.businessNameCustomized,
          ...register("businessNameCustomized"),
          readOnly: isFetchingSiret,
        }}
      />
      <AddressAutocomplete
        initialSearchTerm={establishmentInfos?.businessAddress}
        {...formContents.businessAddress}
        setFormValue={({ address }) =>
          setValue("businessAddress", addressDtoToString(address))
        }
        id={domElementIds.establishment.establishmentFormAddressAutocomplete}
        disabled={isFetchingSiret}
      />
    </>
  );
};
