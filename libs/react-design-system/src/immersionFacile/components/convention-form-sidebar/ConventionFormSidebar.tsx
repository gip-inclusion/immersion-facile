import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Stepper } from "@codegouvfr/react-dsfr/Stepper";
import { useStyles } from "tss-react/dsfr";
import Styles from "./ConventionFormSidebar.styles";

export const ConventionFormSidebar = ({
  sidebarContent,
  currentStep,
}: {
  currentStep: number;
  sidebarContent: Record<string, React.ReactNode>[];
}) => {
  const { cx } = useStyles();
  const maxSteps = sidebarContent.length;
  const stepNumberToStepIndex = (stepNumber: number) => stepNumber - 1;
  return (
    <aside className={cx(fr.cx("fr-p-2w"), Styles.root)}>
      <Stepper
        currentStep={currentStep}
        stepCount={maxSteps}
        title={sidebarContent[stepNumberToStepIndex(currentStep)].title}
      />
      {sidebarContent[stepNumberToStepIndex(currentStep)].description}
    </aside>
  );
};
