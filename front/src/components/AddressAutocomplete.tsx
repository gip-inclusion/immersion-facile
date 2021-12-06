import { useField } from "formik";
import React from "react";
import { apiAdresseGateway } from "src/app/dependencies";
import { DropDown } from "./DropDown";

export type AddressAutocompleteProps = {
  name: string;
  label: string;
  disabled?: boolean;
};

export const AddressAutocomplete = ({
  name,
  label,
  disabled,
}: AddressAutocompleteProps) => {
  const [field, _, { setValue }] = useField<string>(name);
  return (
    <DropDown
      title={label}
      initialTerm={field.value}
      disabled={disabled}
      onSelection={setValue}
      onTermChange={async (newTerm: string) => {
        const results = await apiAdresseGateway.lookupStreetAddress(newTerm);
        return results.map((res) => ({
          value: res,
          description: res,
          matchRanges: [],
        }));
      }}
    />
  );
};
