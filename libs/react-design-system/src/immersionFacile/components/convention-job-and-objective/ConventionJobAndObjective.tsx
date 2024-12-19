import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./ConventionJobAndObjective.styles";

export type ConventionJobAndObjectiveProps = {
  jobTitle: string;
  objective: string;
  jobIllustration: React.ReactNode;
  objectiveIllustration: React.ReactNode;
};

export const ConventionJobAndObjective = ({
  jobTitle,
  objective,
  jobIllustration,
  objectiveIllustration,
}: ConventionJobAndObjectiveProps): JSX.Element => {
  const { cx } = useStyles();

  return (
    <article className={cx(fr.cx("fr-p-2w", "fr-my-4w"), Styles.root)}>
      <ul className={Styles.list}>
        <li className={cx(fr.cx("fr-pb-0"), Styles.item)}>
          <div className={Styles.illustration}>{jobIllustration}</div>
          <div>
            <span className={fr.cx("fr-text--xs", "fr-mb-0")}>
              Métier observé
            </span>
            <p className={fr.cx("fr-text--sm", "fr-text--bold", "fr-mb-0")}>
              {jobTitle}
            </p>
          </div>
        </li>
        <li className={cx(fr.cx("fr-pb-0"), Styles.item)}>
          <div className={Styles.illustration}>{objectiveIllustration}</div>
          <div>
            <span className={fr.cx("fr-text--xs", "fr-mb-0")}>
              Objectif de l'immersion
            </span>
            <p className={fr.cx("fr-text--sm", "fr-text--bold", "fr-mb-0")}>
              {objective}
            </p>
          </div>
        </li>
      </ul>
    </article>
  );
};
