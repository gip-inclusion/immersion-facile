import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Stepper } from "@codegouvfr/react-dsfr/Stepper";
import { useStyles } from "tss-react/dsfr";
import Styles from "./ConventionFormSidebar.styles";

export const ConventionFormSidebar = ({
  sidebarContent,
  currentStep,
  sidebarFooter,
}: {
  currentStep: number;
  sidebarContent: Record<string, React.ReactNode>[];
  sidebarFooter?: React.ReactNode;
}) => {
  const { cx } = useStyles();
  const maxSteps = sidebarContent.length;
  const stepNumberToStepIndex = (stepNumber: number) => stepNumber - 1;
  return (
    <aside className={cx(fr.cx("fr-p-md-2w"), Styles.root)}>
      <Stepper
        currentStep={currentStep}
        stepCount={maxSteps}
        className={cx(Styles.stepper)}
        title={sidebarContent[stepNumberToStepIndex(currentStep)].title}
      />
      <div className={cx(Styles.description)}>
        {sidebarContent[stepNumberToStepIndex(currentStep)].description}
      </div>

      {sidebarFooter && (
        <>
          <hr className={cx(Styles.separator)} />
          <div className={cx(fr.cx("fr-mt-md-2w"), Styles.footer)}>
            {sidebarFooter}
          </div>
        </>
      )}
    </aside>
  );
};
