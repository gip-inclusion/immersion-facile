import { fr } from "@codegouvfr/react-dsfr";
import { Input, type InputProps } from "@codegouvfr/react-dsfr/Input";
import { Select, type SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  countryCodesData,
  defaultCountryCode,
  formatWithPhoneNumberPrefix,
  getCountryCodeFromPhoneNumber,
  isSupportedCountryCode,
  type OmitFromExistingKeys,
  type SupportedCountryCode,
} from "shared";

export type PhoneInputProps = InputProps.RegularInput & {
  defaultCountryCodeValue?: SupportedCountryCode;
  shouldDisplaySelect?: boolean;
  selectProps?: OmitFromExistingKeys<
    SelectProps<SelectProps.Option<SupportedCountryCode>[]>,
    "label" | "options"
  >;
  inputProps?: InputProps.RegularInput;
  onPhoneNumberChange: (phoneNumber: string) => void;
};

export const PhoneInput = ({
  label,
  hintText,
  stateRelatedMessage,
  defaultCountryCodeValue = defaultCountryCode,
  shouldDisplaySelect = false,
  selectProps,
  inputProps,
  onPhoneNumberChange,
  id,
  disabled,
}: PhoneInputProps) => {
  const { setError } = useFormContext();
  const [countryCode, setCountryCode] = useState<SupportedCountryCode | null>(
    null,
  );
  const [displayedPhoneNumber, setDisplayedPhoneNumber] = useState<string>(
    inputProps?.nativeInputProps?.value?.toString() ?? "",
  );

  const getCountryCodeValue = () => {
    const countryCodeFromDisplayedNumber =
      getCountryCodeFromPhoneNumber(displayedPhoneNumber);
    if (countryCodeFromDisplayedNumber) {
      return countryCodeFromDisplayedNumber;
    }
    return countryCode || defaultCountryCodeValue;
  };

  return (
    <div
      className={fr.cx("fr-input-group", "fr-mb-3w", {
        "fr-input-group--error": !!stateRelatedMessage,
      })}
    >
      {label && (
        <label className={fr.cx("fr-label")} htmlFor={id}>
          {label}
        </label>
      )}
      {hintText && <span className={fr.cx("fr-hint-text")}>{hintText}</span>}

      <div className={fr.cx("fr-grid-row", "fr-mt-1w")}>
        {shouldDisplaySelect && (
          <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
            <Select
              label=""
              options={Object.entries(countryCodesData).map(
                ([code, { name, flag }]) => ({
                  value: code,
                  label: `${flag} ${name}`,
                }),
              )}
              nativeSelectProps={{
                ...selectProps?.nativeSelectProps,
                value: getCountryCodeValue(),
                disabled,
                onChange: (event) => {
                  const updatedCountryCode = event.currentTarget.value;
                  if (isSupportedCountryCode(updatedCountryCode)) {
                    setCountryCode(updatedCountryCode);
                    setDisplayedPhoneNumber("");
                    onPhoneNumberChange("");
                  }
                },
              }}
            />
          </div>
        )}

        <div
          className={fr.cx(
            "fr-col",
            shouldDisplaySelect && ["fr-ml-md-1w", "fr-mt-1w", "fr-mt-md-0"],
          )}
        >
          <Input
            label=""
            hintText=""
            nativeInputProps={{
              ...inputProps?.nativeInputProps,
              onChange: (event) => {
                const updatedPhoneNumber = event.currentTarget.value;
                const countryCodeFromPhoneNumber =
                  getCountryCodeFromPhoneNumber(updatedPhoneNumber);
                const shouldUpdateCountryCode =
                  updatedPhoneNumber.includes("+") &&
                  countryCodeFromPhoneNumber &&
                  countryCodeFromPhoneNumber !== countryCode;
                inputProps?.nativeInputProps?.onChange?.(event);
                setDisplayedPhoneNumber(updatedPhoneNumber);
                if (shouldUpdateCountryCode) {
                  setCountryCode(countryCodeFromPhoneNumber);
                }
              },
              onBlur: (event) => {
                const internationalPhoneNumber = formatWithPhoneNumberPrefix(
                  displayedPhoneNumber,
                  countryCode || defaultCountryCodeValue,
                );
                if (internationalPhoneNumber) {
                  onPhoneNumberChange(internationalPhoneNumber);
                }
                if (!internationalPhoneNumber) {
                  setError(inputProps?.nativeInputProps?.name ?? "", {
                    message: "Le numéro de téléphone n'est pas valide",
                  });
                }
                inputProps?.nativeInputProps?.onBlur?.(event);
              },
              value: displayedPhoneNumber,
              type: "tel",
              disabled,
            }}
          />
        </div>
      </div>

      {stateRelatedMessage && (
        <p id={`${id}-error-desc-error`} className={fr.cx("fr-error-text")}>
          {stateRelatedMessage}
        </p>
      )}
    </div>
  );
};
