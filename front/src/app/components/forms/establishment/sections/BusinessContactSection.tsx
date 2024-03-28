import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import React from "react";
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
              onClick: () => onStepChange(2, []),
              iconId: "fr-icon-arrow-left-line",
              priority: "secondary",
              id: domElementIds.establishment[
                mode
              ].previousButtonFromStepAndMode({
                currentStep,
                mode,
              }),
            },
            {
              children: "Étape suivante",
              onClick: () =>
                onStepChange(4, [
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
              id: domElementIds.establishment[mode].nextButtonFromStepAndMode({
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
