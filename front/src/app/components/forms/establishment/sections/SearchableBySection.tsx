import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import RadioButtons, {
  RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import { equals } from "ramda";
import React from "react";
import { useFormContext } from "react-hook-form";
import {
  EstablishmentSearchableBy,
  FormEstablishmentDto,
  domElementIds,
} from "shared";
import allUsersSvg from "../../../../../assets/img/all.svg";
import jobSeekerSvg from "../../../../../assets/img/jobseeker.svg";
import studentSvg from "../../../../../assets/img/student.svg";
import { Mode, OnStepChange, Step } from "../EstablishmentForm";

const searchableByValues: Record<
  "all" | keyof EstablishmentSearchableBy,
  EstablishmentSearchableBy
> = {
  all: {
    jobSeekers: true,
    students: true,
  },
  jobSeekers: {
    jobSeekers: true,
    students: false,
  },
  students: {
    jobSeekers: false,
    students: true,
  },
};

export const SearchableBySection = ({
  onStepChange,
  currentStep,
  mode,
}: {
  onStepChange: OnStepChange;
  currentStep: Step;
  mode: Mode;
}) => {
  const { setValue, watch } = useFormContext<FormEstablishmentDto>();
  const isStepMode = currentStep !== null;
  const searchableByOptions: RadioButtonsProps["options"] = [
    {
      label: "Tout le monde (publics scolaires et non-scolaires)",
      illustration: <img src={allUsersSvg} alt="" />,
      nativeInputProps: {
        value: "all",
        defaultChecked: true,
      },
    },
    {
      label:
        "Uniquement des publics non-scolaires qui ont un projet professionnel",
      illustration: <img src={jobSeekerSvg} alt="" />,
      nativeInputProps: {
        value: "jobSeekers",
      },
    },
    {
      label: "Uniquement des publics scolaires",
      illustration: <img src={studentSvg} alt="" />,
      nativeInputProps: {
        value: "students",
      },
    },
  ];

  return (
    <section className={fr.cx("fr-mb-4w")}>
      <RadioButtons
        legend={
          "Quelle catégorie de public souhaitez-vous recevoir en immersion ?"
        }
        name="searchableBy"
        id={domElementIds.establishment.searchableBy}
        options={searchableByOptions.map((option) => ({
          ...option,
          nativeInputProps: {
            ...option.nativeInputProps,
            checked: equals(
              watch("searchableBy"),
              searchableByValues[
                option.nativeInputProps.value as keyof typeof searchableByValues
              ],
            ),
            onChange: (event) => {
              const value = event.target.value;
              setValue(
                "searchableBy",
                searchableByValues[value as keyof typeof searchableByValues],
              );
            },
          },
        }))}
      />
      {isStepMode && (
        <ButtonsGroup
          inlineLayoutWhen="always"
          alignment="left"
          buttonsEquisized
          buttons={[
            {
              children: "Étape précédente",
              onClick: () => onStepChange(1, []),
              iconId: "fr-icon-arrow-left-line",
              priority: "secondary",
              id: domElementIds.establishment.previousButtonFromStepAndMode({
                currentStep,
                mode,
              }),
            },
            {
              children: "Étape suivante",
              onClick: () => onStepChange(3, ["searchableBy"]),
              iconId: "fr-icon-arrow-right-line",
              iconPosition: "right",
              id: domElementIds.establishment.nextButtonFromStepAndMode({
                currentStep,
                mode,
              }),
            },
          ]}
        />
      )}
    </section>
  );
};
