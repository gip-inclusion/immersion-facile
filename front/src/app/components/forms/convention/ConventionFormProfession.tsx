import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import type { ReactNode } from "react";
import { TextInputError } from "react-design-system";
import { useFormContext } from "react-hook-form";
import {
  type AppellationAndRomeDto,
  type ConventionReadDto,
  domElementIds,
} from "shared";
import { AppellationAutocomplete } from "src/app/components/forms/autocomplete/AppellationAutocomplete";

type ConventionFormProfessionProps = {
  label: string;
  hintText?: ReactNode;
  disabled?: boolean;
};

export const ConventionFormProfession = ({
  label,
  hintText,
  disabled,
}: ConventionFormProfessionProps) => {
  const {
    setValue,
    formState: { errors, touchedFields },
    getValues,
  } = useFormContext<ConventionReadDto>();

  const error =
    touchedFields.immersionAppellation &&
    (errors.immersionAppellation as Partial<AppellationAndRomeDto>)
      ?.appellationLabel;

  if (disabled)
    return (
      <Input
        label={label}
        nativeInputProps={{
          name: "immersionAppellation",
          value: getValues().immersionAppellation?.appellationLabel,
        }}
        disabled
      />
    );
  return (
    <>
      <div className={fr.cx("fr-input-group")}>
        <AppellationAutocomplete
          locator="conventionProfession"
          label={label}
          selectProps={{
            inputId:
              domElementIds.conventionImmersionRoute.conventionSection
                .immersionAppellation,
          }}
          onAppellationSelected={(appellationMatch) => {
            setValue(
              "immersionAppellation.romeCode",
              appellationMatch.appellation.romeCode,
            );
            setValue(
              "immersionAppellation.romeLabel",
              appellationMatch.appellation.romeLabel,
            );
            setValue(
              "immersionAppellation.appellationCode",
              appellationMatch.appellation.appellationCode,
            );
            setValue(
              "immersionAppellation.appellationLabel",
              appellationMatch.appellation.appellationLabel,
            );
          }}
          hintText={hintText}
          onAppellationClear={() => {
            setValue("immersionAppellation.romeCode", "");
            setValue("immersionAppellation.romeLabel", "");
            setValue("immersionAppellation.appellationCode", "");
            setValue("immersionAppellation.appellationLabel", "");
          }}
        />
        {error && <TextInputError errorMessage={error} />}
      </div>
    </>
  );
};
