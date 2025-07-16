import { fr } from "@codegouvfr/react-dsfr";
import { Input, type InputProps } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import type { UseFormRegisterReturn } from "react-hook-form";

const countryData = [
  { code: "DE", name: "Allemagne", flag: "🇩🇪" },
  { code: "AT", name: "Autriche", flag: "🇦🇹" },
  { code: "BE", name: "Belgique", flag: "🇧🇪" },
  { code: "BG", name: "Bulgarie", flag: "🇧🇬" },
  { code: "CY", name: "Chypre", flag: "🇨🇾" },
  { code: "HR", name: "Croatie", flag: "🇭🇷" },
  { code: "DK", name: "Danemark", flag: "🇩🇰" },
  { code: "ES", name: "Espagne", flag: "🇪🇸" },
  { code: "EE", name: "Estonie", flag: "🇪🇪" },
  { code: "FI", name: "Finlande", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GR", name: "Grèce", flag: "🇬🇷" },
  { code: "HU", name: "Hongrie", flag: "🇭🇺" },
  { code: "IE", name: "Irlande", flag: "🇮🇪" },
  { code: "IS", name: "Islande", flag: "🇮🇸" },
  { code: "IT", name: "Italie", flag: "🇮🇹" },
  { code: "LV", name: "Lettonie", flag: "🇱🇻" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮" },
  { code: "LT", name: "Lituanie", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MT", name: "Malte", flag: "🇲🇹" },
  { code: "NO", name: "Norvège", flag: "🇳🇴" },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱" },
  { code: "PL", name: "Pologne", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "CZ", name: "République tchèque", flag: "🇨🇿" },
  { code: "RO", name: "Roumanie", flag: "🇷🇴" },
  { code: "SK", name: "Slovaquie", flag: "🇸🇰" },
  { code: "SI", name: "Slovénie", flag: "🇸🇮" },
  { code: "SE", name: "Suède", flag: "🇸🇪" },
  { code: "CH", name: "Suisse", flag: "🇨🇭" },
];

export type PhoneInputProps = InputProps.RegularInput & {
  selectedCountry?: string;
  registerPhoneNumber: UseFormRegisterReturn;
  registerCountryCode: UseFormRegisterReturn;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  shouldDisplaySelect?: boolean;
};

export const PhoneInput = (props: PhoneInputProps) => {
  const {
    label,
    hintText,
    stateRelatedMessage,
    registerPhoneNumber,
    registerCountryCode,
    onBlur,
    selectedCountry = "fr",
    shouldDisplaySelect = false,
    ...rest
  } = props;

  return (
    <div
      className={fr.cx("fr-input-group", "fr-mb-3w", {
        "fr-input-group--error": !!stateRelatedMessage,
      })}
    >
      {label && (
        <label className={fr.cx("fr-label")} htmlFor={props.id}>
          {label}
        </label>
      )}
      {hintText && <span className={fr.cx("fr-hint-text")}>{hintText}</span>}

      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        {shouldDisplaySelect && (
          <div className={fr.cx("fr-col-3")}>
            <Select
              label=""
              options={countryData.map((country) => ({
                value: country.code,
                label: `${country.flag} ${country.name}`,
              }))}
              nativeSelectProps={{
                ...registerCountryCode,
                value: selectedCountry,
                onChange: (event) => {
                  registerCountryCode.onChange(event);
                },
                disabled: props.disabled,
              }}
            />
          </div>
        )}

        <div className={fr.cx(shouldDisplaySelect ? "fr-col-9" : "fr-col-12")}>
          <Input
            label=""
            hintText=""
            nativeInputProps={{
              ...registerPhoneNumber,
              ...rest,
              type: "tel",
              onBlur: (event) => {
                registerPhoneNumber.onBlur(event);
                onBlur?.(event);
              },
            }}
          />
        </div>
      </div>

      {stateRelatedMessage && (
        <p
          id={`${props.id}-error-desc-error`}
          className={fr.cx("fr-error-text")}
        >
          {stateRelatedMessage}
        </p>
      )}
    </div>
  );
};
