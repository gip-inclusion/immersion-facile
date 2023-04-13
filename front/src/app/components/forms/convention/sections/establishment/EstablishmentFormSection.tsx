import React from "react";
import { useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";

import { ConventionDto, FederatedIdentity } from "shared";

import { SectionTitle } from "react-design-system";

import { ShareActions } from "src/app/components/forms/convention/ShareActions";
import { booleanSelectOptions } from "src/app/contents/forms/common/values";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useTutorIsEstablishmentRepresentative } from "src/app/hooks/convention.hooks";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";

import { EstablishementTutorFields } from "./EstablishementTutorFields";
import { EstablishmentBusinessFields } from "./EstablishmentBusinessFields";
import { EstablishmentRepresentativeFields } from "./EstablishmentRepresentativeFields";

type EstablishmentFormSectionParams = {
  isFrozen: boolean | undefined;
  federatedIdentity: FederatedIdentity | undefined;
};

export const EstablishmentFormSection = ({
  isFrozen,
  federatedIdentity,
}: EstablishmentFormSectionParams): JSX.Element => {
  useTutorIsEstablishmentRepresentative();

  const dispatch = useDispatch();
  const isTutorEstablishmentRepresentative = useAppSelector(
    conventionSelectors.isTutorEstablishmentRepresentative,
  );
  const { getValues } = useFormContext<ConventionDto>();
  const values = getValues();
  const t = useConventionTexts(getValues().internshipKind);

  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  const { isFetchingSiret } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: true,
  });

  return (
    <>
      <SectionTitle>
        {t.establishmentSection.title}
        <ShareActions
          isFrozen={isFrozen || isFetchingSiret}
          federatedIdentity={federatedIdentity}
        />
      </SectionTitle>
      <Alert
        severity="info"
        small
        className={fr.cx("fr-my-2w")}
        description={t.establishmentSection.subtitle}
      />

      <EstablishmentBusinessFields disabled={isFrozen || isFetchingSiret} />
      <RadioButtons
        {...formContents.isEstablishmentTutorIsEstablishmentRepresentative}
        legend={
          formContents.isEstablishmentTutorIsEstablishmentRepresentative.label
        }
        hintText={
          formContents.isEstablishmentTutorIsEstablishmentRepresentative
            .hintText
        }
        options={booleanSelectOptions.map((option) => ({
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
            },
          },
        }))}
        disabled={isFrozen || isFetchingSiret}
      />
      <EstablishementTutorFields disabled={isFrozen} />
      {!isTutorEstablishmentRepresentative && (
        <EstablishmentRepresentativeFields
          disabled={isFrozen || isFetchingSiret}
        />
      )}
    </>
  );
};
