import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { values } from "ramda";
import { ErrorNotifications, HeadingSection } from "react-design-system";
import { useFormContext } from "react-hook-form";
import {
  type AppellationAndRomeDto,
  addressDtoToString,
  domElementIds,
  emptyAppellationAndRome,
  type FormEstablishmentDto,
  removeAtIndex,
} from "shared";
import type {
  Mode,
  OnStepChange,
  Step,
} from "src/app/components/forms/establishment/EstablishmentForm";
import { MultipleAddressInput } from "src/app/components/forms/establishment/MultipleAddressInput";
import { MultipleAppellationInput } from "src/app/components/forms/establishment/MultipleAppellationInput";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  displayReadableError,
  getFormContents,
  toErrorsWithLabels,
} from "src/app/hooks/formContents.hooks";
import { v4 as uuidV4 } from "uuid";

export const OffersSection = ({
  mode,
  onStepChange,
  currentStep,
}: {
  mode: Mode;
  onStepChange: OnStepChange;
  currentStep: Step;
}) => {
  const isStepMode = currentStep !== null;
  const methods = useFormContext<FormEstablishmentDto>();
  const {
    setValue,
    watch,
    formState: { errors },
  } = methods;
  const formValues = watch();
  const formContents = getFormContents(
    formEstablishmentFieldsLabels(mode),
  ).getFormFields();
  const formErrors = getFormContents(
    formEstablishmentFieldsLabels(mode),
  ).getFormErrors();

  return (
    <>
      <HeadingSection
        title={formContents.businessAddresses.label}
        description="Par défaut, vous apparaîtrez dans les résultats de recherche liés à l’adresse de votre établissement. Vous pouvez ajouter d’autres adresses si vous proposez des immersions ailleurs. Par exemple : votre société est située à Dijon (adresse liée à votre SIRET) mais vous proposez une immersion dans votre antenne de Nantes."
      >
        <MultipleAddressInput
          name="businessAddress"
          currentAddresses={formValues.businessAddresses}
          onAddressAdded={(address, index) => {
            const currentAddresses = formValues.businessAddresses;
            currentAddresses[index] = {
              id: uuidV4(),
              rawAddress: addressDtoToString(address),
            };
            setValue("businessAddresses", currentAddresses);
          }}
          onAddressDeleted={(index) => {
            const addresses = formValues.businessAddresses;
            const newAddresses =
              index === 0 && addresses.length === 1
                ? [
                    {
                      id: "",
                      rawAddress: "",
                    },
                  ]
                : removeAtIndex(addresses, index);
            setValue("businessAddresses", newAddresses);
          }}
          id={domElementIds.establishment[mode].businessAddresses}
        />
      </HeadingSection>
      <HeadingSection
        title={formContents.appellations.label}
        description="Les métiers que vous proposez à l’immersion"
      >
        {" "}
        <MultipleAppellationInput
          name={formContents.appellations.name}
          id={domElementIds.establishment[mode].appellations}
          onAppellationAdd={(appellation, index) => {
            const appellationsToUpdate = formValues.appellations;
            appellationsToUpdate[index] = appellation;
            setValue("appellations", appellationsToUpdate);
          }}
          onAppellationDelete={(appellationIndex) => {
            const appellationsToUpdate = formValues.appellations;
            const newAppellations: AppellationAndRomeDto[] =
              appellationIndex === 0 && appellationsToUpdate.length === 1
                ? [emptyAppellationAndRome]
                : removeAtIndex(formValues.appellations, appellationIndex);
            setValue("appellations", newAppellations);
          }}
          currentAppellations={formValues.appellations}
          error={errors?.appellations?.message}
        />
      </HeadingSection>
      {isStepMode && (
        <>
          <ErrorNotifications
            errorsWithLabels={toErrorsWithLabels({
              labels: formErrors,
              errors: displayReadableError(errors),
            })}
            visible={values(errors).length > 0}
          />

          <ButtonsGroup
            inlineLayoutWhen="always"
            alignment="left"
            buttonsEquisized
            className={fr.cx("fr-mt-4w")}
            buttons={[
              {
                children: "Étape précédente",
                iconId: "fr-icon-arrow-left-line",
                priority: "secondary",
                id: domElementIds.establishment[
                  mode
                ].previousButtonFromStepAndMode({
                  currentStep,
                  mode,
                }),
                type: "button",
                onClick: () => {
                  onStepChange(1, []);
                },
              },
              {
                children: "Étape suivante",
                onClick: () => {
                  onStepChange(3, ["appellations", "businessAddresses"]);
                },
                type: "button",
                iconId: "fr-icon-arrow-right-line",
                iconPosition: "right",
                id: domElementIds.establishment[mode].nextButtonFromStepAndMode(
                  {
                    currentStep,
                    mode,
                  },
                ),
              },
            ]}
          />
        </>
      )}
    </>
  );
};
