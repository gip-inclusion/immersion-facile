import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./SectionConventionNextSteps.styles";

export type SectionConventionNextStepsProps = {
  nextSteps: {
    illustration: string;
    content: React.ReactNode;
  }[];
};

export const SectionConventionNextSteps = ({
  nextSteps,
}: SectionConventionNextStepsProps) => {
  const { cx } = useStyles();
  return (
    <section className={cx(fr.cx("fr-mt-10w", "fr-mb-5w"), Styles.root)}>
      <div className={fr.cx("fr-container")}>
        <h2 className={cx(fr.cx("fr-mb-7w", "fr-text--lg"), Styles.title)}>
          Quelles sont les prochaines étapes ?
        </h2>

        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          {nextSteps.map(({ content, illustration }) => (
            <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
              <div
                className={cx(
                  fr.cx("fr-m-auto", "fr-mb-5w", "fr-pt-md-4w"),
                  Styles.illustrationWrapper,
                )}
              >
                <img
                  className={Styles.illustration}
                  src={illustration}
                  alt={""}
                />
              </div>
              {content}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
