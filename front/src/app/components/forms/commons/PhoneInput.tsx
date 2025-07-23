import { fr } from "@codegouvfr/react-dsfr";
import { Input, type InputProps } from "@codegouvfr/react-dsfr/Input";
import { Select, type SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  countryCodesData,
  defaultCountryCode,
  getCountryCodeFromPhoneNumber,
  isSupportedCountryCode,
  type OmitFromExistingKeys,
  type SupportedCountryCode,
  toInternationalPhoneNumber,
} from "shared";

export type PhoneInputProps = InputProps.RegularInput & {
  selectedCountry?: SupportedCountryCode;
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
  selectedCountry = defaultCountryCode,
  shouldDisplaySelect = false,
  selectProps,
  inputProps,
  onPhoneNumberChange,
  id,
  disabled,
}: PhoneInputProps) => {
  const { setError } = useFormContext();
  const [countryCode, setCountryCode] =
    useState<SupportedCountryCode>(selectedCountry);
  const [displayedPhoneNumber, setDisplayedPhoneNumber] = useState<string>(
    inputProps?.nativeInputProps?.defaultValue?.toString() ?? "",
  );
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
          <div className={fr.cx("fr-col-3")}>
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
                value: countryCode,
                disabled,
                onChange: (event) => {
                  const updatedCountryCode = event.currentTarget.value;
                  if (isSupportedCountryCode(updatedCountryCode)) {
                    setCountryCode(updatedCountryCode);
                    const internationalPhoneNumber = toInternationalPhoneNumber(
                      displayedPhoneNumber,
                      updatedCountryCode,
                    );
                    if (internationalPhoneNumber) {
                      onPhoneNumberChange(internationalPhoneNumber);
                    }
                    if (!internationalPhoneNumber) {
                      setError(inputProps?.nativeInputProps?.name ?? "", {
                        message: "Le numéro de téléphone n'est pas valide",
                      });
                    }
                  }
                },
              }}
            />
          </div>
        )}

        <div className={fr.cx("fr-col", shouldDisplaySelect && "fr-ml-1w")}>
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
                const internationalPhoneNumber = toInternationalPhoneNumber(
                  displayedPhoneNumber,
                  countryCode,
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
