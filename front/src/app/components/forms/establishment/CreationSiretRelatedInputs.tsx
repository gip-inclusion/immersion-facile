import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
  type FormEstablishmentDto,
  type NumberEmployeesRange,
  defaultMaxContactsPerMonth,
} from "shared";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";
import { v4 as uuidV4 } from "uuid";

export const CreationSiretRelatedInputs = () => {
  const {
    establishmentInfos,
    isFetchingSiret,
    siretErrorToDisplay,
    updateSiret,
  } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: false,
    addressAutocompleteLocator: "create-establishment-address",
  });
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
      <p>
        <a
          className={fr.cx("fr-link")}
          href={"https://annuaire-entreprises.data.gouv.fr"}
          target="_blank"
          rel="noreferrer"
        >
          Retrouver votre SIRET sur l’Annuaire des Entreprises
        </a>
      </p>

      <Input
        label={formContents.businessName.label}
        hintText={formContents.businessName.hintText}
        disabled
        nativeInputProps={{
          ...formContents.businessName,
          ...register("businessName"),
        }}
      />
      <Input
        label={formContents.businessNameCustomized.label}
        hintText={formContents.businessNameCustomized.hintText}
        disabled={isFetchingSiret}
        nativeInputProps={{
          ...formContents.businessNameCustomized,
          ...register("businessNameCustomized", {
            setValueAs: (value) => (value ? value : undefined),
          }),
        }}
        {...getFieldError("businessNameCustomized")}
      />
    </>
  );
};

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
