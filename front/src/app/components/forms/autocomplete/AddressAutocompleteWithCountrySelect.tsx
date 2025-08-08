import { fr } from "@codegouvfr/react-dsfr";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  countryCodesData,
  getCountryCodeFromAddress,
  type SupportedCountryCode,
} from "shared";
import { geocodingSlice } from "src/core-logic/domain/geocoding/geocoding.slice";
import {
  AddressAutocomplete,
  type AddressAutocompleteProps,
} from "./AddressAutocomplete";

export const AddressAutocompleteWithCountrySelect = ({
  onAddressClear,
  onAddressSelected,
  multiple,
  countryCode,
  withCountrySelect = false,
  initialInputValue,
  ...props
}: AddressAutocompleteProps) => {
  const dispatch = useDispatch();
  const [selectedCountryCode, setSelectedCountryCode] =
    useState<SupportedCountryCode | null>(null);

  const [inputValue, setInputValue] = useState<string | undefined>(
    initialInputValue,
  );

  const countryOptions = Object.entries(countryCodesData).map(
    ([code, { name, flag }]) => ({
      value: code as SupportedCountryCode,
      label: `${flag} ${name}`,
    }),
  );

  const getSelectedCountryCode = () => {
    const countryCodeFromAddressValue = inputValue
      ? getCountryCodeFromAddress(inputValue)
      : null;
    if (countryCodeFromAddressValue) {
      return countryCodeFromAddressValue;
    }
    return selectedCountryCode ?? countryCode;
  };

  return (
    <div className={fr.cx("fr-mb-2w")}>
      {withCountrySelect && (
        <div className={fr.cx("fr-mb-2w")}>
          <Select
            label="Pays où se déroulera l'immersion"
            options={countryOptions}
            nativeSelectProps={{
              value: getSelectedCountryCode(),
              onChange: (event) => {
                const newCountryCode = event.currentTarget
                  .value as SupportedCountryCode;
                setSelectedCountryCode(newCountryCode);
                setInputValue("");
                dispatch(
                  geocodingSlice.actions.emptyQueryRequested({
                    locator: props.locator,
                  }),
                );
                dispatch(
                  geocodingSlice.actions.clearLocatorDataRequested({
                    locator: props.locator,
                    multiple,
                  }),
                );
                onAddressClear();
                dispatch(
                  geocodingSlice.actions.changeQueryRequested({
                    locator: props.locator,
                    lookup: "",
                    countryCode: newCountryCode,
                  }),
                );
              },
            }}
          />
        </div>
      )}
      <AddressAutocomplete
        {...props}
        withCountrySelect={false}
        onAddressClear={onAddressClear}
        onAddressSelected={onAddressSelected}
        multiple={multiple}
        countryCode={countryCode}
        initialInputValue={inputValue}
      />
    </div>
  );
};
