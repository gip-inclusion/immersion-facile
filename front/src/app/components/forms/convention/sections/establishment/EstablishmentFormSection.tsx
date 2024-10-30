import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import {
  RadioButtons,
  RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { ConventionDto, InternshipKind } from "shared";
import {
  EmailValidationErrorsState,
  SetEmailValidationErrorsState,
} from "src/app/components/forms/convention/ConventionForm";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useTutorIsEstablishmentRepresentative } from "src/app/hooks/convention.hooks";
import { getFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { EstablishementTutorFields } from "./EstablishementTutorFields";
import { EstablishmentBusinessFields } from "./EstablishmentBusinessFields";
import { EstablishmentRepresentativeFields } from "./EstablishmentRepresentativeFields";

export const tutorSelectOptions = (
  internshipKind: InternshipKind,
): RadioButtonsProps["options"] => [
  {
    label: "Le représentant de la structure d'accueil sera également le tuteur",
    hintText: `La même personne signera la convention, accompagnera le candidat en ${
      internshipKind === "immersion" ? "immersion" : "stage"
    } au sein de la structure d'accueil et remplira le bilan avec lui.`,
    nativeInputProps: {
      value: 1,
    },
  },
  {
    label: "Le tuteur est différent du représentant de la structure d'accueil",
    hintText: `Le tuteur accompagnera le candidat en ${
      internshipKind === "immersion" ? "immersion" : "stage"
    } dans l'entreprise et remplira le bilan avec lui. Il ne signera pas la convention, mais la recevra tout de même par email.`,
    nativeInputProps: {
      value: 0,
    },
  },
];

export const EstablishmentFormSection = ({
  setEmailValidationErrors,
  emailValidationErrors,
}: {
  setEmailValidationErrors: SetEmailValidationErrorsState;
  emailValidationErrors: EmailValidationErrorsState;
}): JSX.Element => {
  useTutorIsEstablishmentRepresentative();

  const dispatch = useDispatch();
  const isTutorEstablishmentRepresentative = useAppSelector(
    conventionSelectors.isTutorEstablishmentRepresentative,
  );
  const { getValues, resetField } = useFormContext<ConventionDto>();
  const t = useConventionTexts(getValues().internshipKind);

  const { getFormFields } = getFormContents(
    formConventionFieldsLabels(getValues("internshipKind")),
  );
  const formContents = getFormFields();

  const isFetchingSiret = useSelector(siretSelectors.isFetching);

  const areTutorAndRepresentativeSame = () => {
    const representative = getValues("signatories.establishmentRepresentative");
    const tutor = getValues("establishmentTutor");
    return (
      representative.firstName === tutor.firstName &&
      tutor.lastName === representative.lastName &&
      tutor.phone === representative.phone &&
      tutor.email === representative.email
    );
  };

  const resetTutorFields = () => {
    resetField("establishmentTutor.firstName", {
      defaultValue: "",
    });
    resetField("establishmentTutor.lastName", {
      defaultValue: "",
    });
    resetField("establishmentTutor.email", {
      defaultValue: "",
    });
    resetField("establishmentTutor.phone", {
      defaultValue: "",
    });
  };

  return (
    <>
      <Alert
        severity="info"
        small
        className={fr.cx("fr-my-2w")}
        description={t.establishmentSection.subtitle}
      />

      <EstablishmentBusinessFields />
      <EstablishmentRepresentativeFields
        emailValidationErrors={emailValidationErrors}
        setEmailValidationErrors={setEmailValidationErrors}
      />
      <RadioButtons
        legend={
          formContents.isEstablishmentTutorIsEstablishmentRepresentative.label
        }
        options={tutorSelectOptions(getValues("internshipKind")).map(
          (option) => ({
            ...option,
            nativeInputProps: {
              checked:
                Boolean(option.nativeInputProps.value) ===
                isTutorEstablishmentRepresentative,
              onChange: () => {
                dispatch(
                  conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(
                    option.nativeInputProps.value === 1,
                  ),
                );
                if (areTutorAndRepresentativeSame()) {
                  resetTutorFields();
                }
              },
            },
          }),
        )}
        disabled={isFetchingSiret}
      />
      <EstablishementTutorFields
        emailValidationErrors={emailValidationErrors}
        setEmailValidationErrors={setEmailValidationErrors}
        isTutorEstablishmentRepresentative={isTutorEstablishmentRepresentative}
      />
    </>
  );
};
