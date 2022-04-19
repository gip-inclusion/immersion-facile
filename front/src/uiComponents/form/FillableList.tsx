import MuiChip from "@mui/material/Chip";
import { styled } from "@mui/material/styles";
import * as React from "react";
import { useEffect, useState } from "react";
import { notEqual } from "src/shared/ramdaExtensions/notEqual";
import { OmitFromExistingKeys } from "src/shared/utils";
import { Button } from "src/uiComponents/Button";
import { ImmersionTextField } from "src/uiComponents/form/ImmersionTextField";
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
    <div className="flex items-center w-full">
      <ImmersionTextField
        type="text"
        description={description}
        className="w-[620px]"
        label={label}
        placeholder={placeholder}
        name={name}
        value={inputValue}
        error={error ?? undefined}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAddClick();
          }
        }}
      />
      <Button type="button" className="h-10" onSubmit={onAddClick}>
        Ajouter
      </Button>
    </div>
  );
};

type ListOfChipProps = {
  values: string[];
  onDelete: (valueToDelete: string) => void;
};

const ListOfChip = ({ values, onDelete }: ListOfChipProps) => (
  <div className="pb-4">
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
