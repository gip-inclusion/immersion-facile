import MuiChip from "@mui/material/Chip";
import { styled } from "@mui/material/styles";
import * as React from "react";
import { useEffect, useState } from "react";
import { notEqual } from "shared";
import { OmitFromExistingKeys } from "shared";
import { Button } from "react-design-system/immersionFacile";
import { z } from "zod";

const immersionBlue = "#3458a2";

const Chip = styled(MuiChip)({
  borderColor: immersionBlue,
  color: immersionBlue,
  fontWeight: "bold",
  backgroundColor: "white",
});

export const FillableList = (
  props: OmitFromExistingKeys<AddToListProps, "onAdd"> & {
    valuesInList: string[];
    setValues: (values: string[]) => void;
  },
) => {
  const { valuesInList, setValues, ...addToListProps } = props;

  return (
    <>
      <AddToList
        {...addToListProps}
        onAdd={(inputValue) => {
          setValues([...valuesInList, inputValue]);
        }}
      />
      <ListOfChip
        values={valuesInList}
        onDelete={(valueToDelete) => {
          setValues(valuesInList.filter(notEqual(valueToDelete)));
        }}
      />
    </>
  );
};

type AddToListProps = {
  name: string;
  onAdd: (inputValue: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  validationSchema?: z.ZodSchema<unknown>;
};

const createGetInputError =
  (validationSchema?: z.ZodSchema<unknown>) =>
  (stringToValidate: string): string | null => {
    if (!validationSchema) return null;

    try {
      validationSchema.parse(stringToValidate);
      return null;
    } catch (e: any) {
      const zodError: z.ZodError = e;
      return zodError.errors[0].message;
    }
  };

const AddToList = ({
  name,
  label,
  placeholder,
  description,
  onAdd,
  validationSchema,
}: AddToListProps) => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const getInputError = createGetInputError(validationSchema);

  useEffect(() => {
    if (!inputValue || !error) return;
    setError(getInputError(inputValue));
  }, [error, inputValue]);

  const onAddClick = () => {
    if (!inputValue) return;

    const inputError = getInputError(inputValue);
    if (inputError) return setError(inputError);

    onAdd(inputValue);
    setInputValue("");
  };

  return (
    <div>
      <div className={`fr-input-group${error ? " fr-input-group--error" : ""}`}>
        <label className="fr-label" htmlFor={name}>
          {label}
        </label>
        {description && (
          <span className="fr-hint-text" id="select-hint-desc-hint">
            {description}
          </span>
        )}
        <div className="flex items-center justify-center w-full">
          <input
            id={name}
            value={inputValue}
            type="text"
            name={name}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddClick();
              }
            }}
            onChange={(e) => setInputValue(e.target.value)}
            className={`fr-input${error ? " fr-input--error" : ""}`}
            placeholder={placeholder || ""}
            aria-describedby="text-input-error-desc-error"
          />
          <Button type="button" className="h-10" onSubmit={onAddClick}>
            Ajouter
          </Button>
        </div>
        {error && (
          <p id="text-input-email-error-desc-error" className="fr-error-text">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

type ListOfChipProps = {
  values: string[];
  onDelete: (valueToDelete: string) => void;
};

const ListOfChip = ({ values, onDelete }: ListOfChipProps) => (
  <div className="pt-2">
    {values.map((value) => (
      <span key={value} className="px-1">
        <Chip
          variant="outlined"
          label={value}
          onDelete={() => onDelete(value)}
        />
      </span>
    ))}
  </div>
);
