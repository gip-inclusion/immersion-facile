import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import { v4 as uuidV4 } from "uuid";

import {
  type FormEstablishmentDto,
  type NumberEmployeesRange,
  addressDtoToString,
  defaultMaxContactsPerMonth,
  domElementIds,
} from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";
import { establishmentSelectors } from "src/core-logic/domain/establishment/establishment.selectors";
import { establishmentSlice } from "src/core-logic/domain/establishment/establishment.slice";

const maxContactPerWeekByNumberEmployees: Record<NumberEmployeesRange, number> =
  {
    "": defaultMaxContactsPerMonth,
    "0": 4,
    "1-2": 4,
    "3-5": 4,
    "6-9": 4,
    "10-19": 8,
    "20-49": 8,
    "50-99": 20,
    "100-199": 40,
    "200-249": 80,
    "250-499": 80,
    "500-999": 80,
    "1000-1999": 80,
    "2000-4999": 80,
    "5000-9999": 80,
    "+10000": 80,
  };

export const CreationSiretRelatedInputs = () => {
  const {
    currentSiret,
    establishmentInfos,
    isFetchingSiret,
    siretErrorToDisplay,
    siretRawError,
    updateSiret,
  } = useSiretFetcher({ shouldFetchEvenIfAlreadySaved: false });
  const isLoading = useAppSelector(establishmentSelectors.isLoading);
  const {
    setValue,
    register,
    formState: { touchedFields },
  } = useFormContext<FormEstablishmentDto>();
  const { getFormFields } = getFormContents(
    formEstablishmentFieldsLabels("create"),
  );
  const formContents = getFormFields();
  const getFieldError = makeFieldError(
    useFormContext<FormEstablishmentDto>().formState,
  );

  const establishmentFeedback = useFeedbackTopic(
    "establishment-modification-link",
  );

  useEffect(() => {
    if (isFetchingSiret) return;
    setValue(
      "businessName",
      establishmentInfos ? establishmentInfos.businessName : "",
    );
    setValue(
      "businessAddresses.0",
      establishmentInfos
        ? {
            rawAddress: establishmentInfos.businessAddress,
            id: uuidV4(),
          }
        : {
            id: "",
            rawAddress: "",
          },
    );
    setValue("naf", establishmentInfos ? establishmentInfos.nafDto : undefined);
    setValue(
      "maxContactsPerMonth",
      establishmentInfos
        ? maxContactPerWeekByNumberEmployees[
            establishmentInfos.numberEmployeesRange
          ]
        : defaultMaxContactsPerMonth,
    );
  }, [establishmentInfos]);

  const dispatch = useDispatch();
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
          readOnly: isFetchingSiret,
        }}
        state={siretErrorToDisplay && touchedFields.siret ? "error" : "default"}
        stateRelatedMessage={
          touchedFields.siret && siretErrorToDisplay ? siretErrorToDisplay : ""
        }
      />
      {siretRawError === "Establishment with this siret is already in our DB" &&
        establishmentFeedback &&
        establishmentFeedback.level !== "success" && (
          <div className={fr.cx("fr-mb-4w")}>
            Cette entreprise a déjà été référencée.
            <Button
              className={fr.cx("fr-mt-2w")}
              onClick={() => {
                dispatch(
                  establishmentSlice.actions.sendModificationLinkRequested({
                    siret: currentSiret,
                    feedbackTopic: "establishment-modification-link",
                  }),
                );
              }}
              nativeButtonProps={{
                id: domElementIds.establishment.create
                  .errorSiretAlreadyExistButton,
                disabled: isLoading,
              }}
              type="button"
            >
              Demande de modification du formulaire de référencement
            </Button>
            <Feedback
              topic="establishment-modification-link"
              render={({ level }) => (
                <>
                  {level === "error" && (
                    <p className={fr.cx("fr-error-text")}>
                      Un email contenant un lien de modification a déjà été
                      envoyé
                    </p>
                  )}
                  {level === "success" && (
                    <Alert
                      severity="success"
                      title="Succès de la demande"
                      description="Succès. Un mail a été envoyé au référent de cet établissement avec un
        lien permettant la mise à jour des informations."
                      className={fr.cx("fr-mb-4w")}
                    />
                  )}
                </>
              )}
            />
          </div>
        )}

      <Input
        label={formContents.businessName.label}
        hintText={formContents.businessName.hintText}
        nativeInputProps={{
          ...formContents.businessName,
          ...register("businessName"),
          readOnly: true,
        }}
      />
      <Input
        label={formContents.businessNameCustomized.label}
        hintText={formContents.businessNameCustomized.hintText}
        nativeInputProps={{
          ...formContents.businessNameCustomized,
          ...register("businessNameCustomized", {
            setValueAs: (value) => (value ? value : undefined),
          }),
          readOnly: isFetchingSiret,
        }}
        {...getFieldError("businessNameCustomized")}
      />
      <AddressAutocomplete
        initialSearchTerm={establishmentInfos?.businessAddress}
        label={"Vérifiez l'adresse de votre établissement *"}
        id={domElementIds.establishment.create.addressAutocomplete}
        setFormValue={({ address }) =>
          setValue("businessAddresses.0", {
            id: uuidV4(),
            rawAddress: addressDtoToString(address),
          })
        }
        disabled={isFetchingSiret}
      />
    </>
  );
};
