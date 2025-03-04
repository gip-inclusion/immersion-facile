import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  FormEstablishmentDto,
  NumberEmployeesRange,
  addressDtoToString,
  defaultMaxContactsPerMonth,
  domElementIds,
} from "shared";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";
import { routes } from "src/app/routes/routes";
import { establishmentSelectors } from "src/core-logic/domain/establishment/establishment.selectors";
import { v4 as uuidV4 } from "uuid";

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

  const _dispatch = useDispatch();
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
      {siretRawError ===
        "Establishment with this siret is already in our DB" && (
        <div className={fr.cx("fr-mb-4w")}>
          Cette entreprise a déjà été référencée. Vous pouvez la modifier via
          votre tableau de bord entreprise.
          <Button
            className={fr.cx("fr-mt-2w")}
            onClick={() => {
              routes.establishmentDashboard().push();
            }}
            nativeButtonProps={{
              id: domElementIds.establishment.create
                .errorSiretAlreadyExistButton,
              disabled: isLoading,
            }}
            type="button"
          >
            Accéder à mon tableau de bord
          </Button>
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
