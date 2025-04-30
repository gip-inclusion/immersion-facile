import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { domElementIds } from "shared";
import { BusinessContact } from "../BusinessContact";
import type { Mode, OnStepChange, Step } from "../EstablishmentForm";

export const BusinessContactSection = ({
  onStepChange,
  currentStep,
  mode,
}: {
  onStepChange: OnStepChange;
  currentStep: Step;
  mode: Mode;
  setInvalidEmailMessage: Dispatch<SetStateAction<ReactNode | null>>;
}) => {
  const isStepMode = currentStep !== null;
  return (
    <section className={fr.cx("fr-mb-4w")}>
      <BusinessContact mode={mode} />
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
              onClick: () => onStepChange(4, ["userRights", "contactMode"]),
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
