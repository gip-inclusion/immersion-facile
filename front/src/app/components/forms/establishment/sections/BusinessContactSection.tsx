import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { BusinessContact } from "../BusinessContact";
import { OnStepChange, Step } from "../EstablishmentForm";

export const BusinessContactSection = ({
  onStepChange,
  currentStep,
}: {
  onStepChange: OnStepChange;
  currentStep: Step;
}) => (
  <section className={fr.cx("fr-mb-4w")}>
    <BusinessContact />
    {currentStep !== null && (
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
          },
        ]}
      />
    )}
  </section>
);
