import { useField } from "formik";
import React from "react";
import { DropDown } from "src/app/ImmersionOffer/DropDown";
import { ImmersionOfferDto } from "src/shared/ImmersionOfferDto";
import { NafSectorCode, nafSectorLabels } from "src/shared/naf";

export const nafSectorsInArray = Object.entries(nafSectorLabels).map(
  ([code, description]) => ({ code: code as NafSectorCode, description }),
);

export const BusinessSectorInput = () => {
  const name: keyof ImmersionOfferDto = "businessSectorCode";
  const [field, __, { setValue }] = useField<NafSectorCode>(name);
  const businessSectorCode = field.value;

  return (
    <DropDown
      title="Secteur d'activité"
      initialValue={nafSectorLabels[businessSectorCode]}
      onSelection={(v) => setValue(v as NafSectorCode)}
      onTermChange={async (newTerm) => {
        return nafSectorsInArray
          .filter(
            ({ description, code }) =>
              code !== "0" &&
              description.toLowerCase().includes(newTerm.toLowerCase()),
          )
          .map(({ code, description }) => ({
            value: code,
            description,
            matchRanges: [],
          }));
      }}
    />
  );
};
