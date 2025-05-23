import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { useFormContext, useWatch } from "react-hook-form";
import type { ConventionDto } from "shared";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { getFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  useSiretFetcher,
  useSiretRelatedField,
} from "src/app/hooks/siret.hooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

export const EstablishmentBusinessFields = (): JSX.Element => {
  const {
    currentSiret,
    updateSiret,
    siretErrorToDisplay,
    establishmentInfos,
    isFetchingSiret,
  } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: true,
    addressAutocompleteLocator: "convention-immersion-address",
  });
  const convention = useAppSelector(conventionSelectors.convention);
  const { getValues, register, control, setValue } =
    useFormContext<ConventionDto>();
  const values = getValues();
  const isSiretFetcherEnabled =
    values.status === "READY_TO_SIGN" && values.immersionAddress === "";

  const isSiretFetcherDisabled = !isSiretFetcherEnabled;

  useSiretRelatedField("businessName", {
    disabled: false, // the input is always disabled, so we can safely update businessName from siret
  });
  useSiretRelatedField("businessAddress", {
    fieldToUpdate: "immersionAddress",
    disabled: isSiretFetcherDisabled,
  });

  const siretValueOnForm = useWatch({ control, name: "siret" });

  const { getFormFields } = getFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();

  return (
    <>
      <Input
        label={formContents.siret.label}
        hintText={formContents.siret.hintText}
        nativeInputProps={{
          ...formContents.siret,
          onChange: (event) => {
            setValue("siret", event.target.value);
            updateSiret(event.target.value);
          },
          value: currentSiret || siretValueOnForm,
        }}
        disabled={isFetchingSiret}
        state={siretErrorToDisplay ? "error" : undefined}
        stateRelatedMessage={siretErrorToDisplay}
        className={fr.cx("fr-mb-1w")}
      />
      <a
        href="https://annuaire-entreprises.data.gouv.fr/"
        target="_blank"
        rel="noreferrer"
        className={fr.cx("fr-link")}
      >
        <i className={fr.cx("fr-icon-information-fill", "fr-icon--sm")} />
        Retrouver votre siret sur l'Annuaire des Entreprises
      </a>
      <Input
        label={formContents.businessName.label}
        hintText={formContents.businessName.hintText}
        nativeInputProps={{
          ...formContents.businessName,
          ...register("businessName"),
          value:
            establishmentInfos?.businessName || convention?.businessName || "",
        }}
        disabled={true}
        className={fr.cx("fr-mt-3w")}
      />
    </>
  );
};
