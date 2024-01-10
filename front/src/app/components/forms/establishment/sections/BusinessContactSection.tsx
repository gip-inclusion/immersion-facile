import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { domElementIds } from "shared";
import { BusinessContact } from "../BusinessContact";
import { Mode, OnStepChange, Step } from "../EstablishmentForm";

export const BusinessContactSection = ({
  onStepChange,
  currentStep,
  mode,
}: {
  onStepChange: OnStepChange;
  currentStep: Step;
  mode: Mode;
}) => {
  const isStepMode = currentStep !== null;
  return (
    <section className={fr.cx("fr-mb-4w")}>
      <BusinessContact />
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
              onClick: () =>
                onStepChange(3, [
                  "businessContact.firstName",
                  "businessContact.lastName",
                  "businessContact.job",
                  "businessContact.phone",
                  "businessContact.email",
                  "businessContact.copyEmails",
                  "businessContact.contactMethod",
                ]),
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
