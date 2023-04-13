import React, { ReactNode } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { makeStyles } from "tss-react/dsfr";

import "./SectionTitle.scss";

type FormSectionTitleProps = {
  children: ReactNode[] | ReactNode;
};

const componentName = "im-section-title";

export const SectionTitle = ({ children }: FormSectionTitleProps) => {
  const [title, ...actions] = Array.isArray(children) ? children : [children];
  const { cx } = useStyles();
  return (
    <>
      <h3 className={cx(fr.cx("fr-h6", "fr-mt-4w", "fr-mb-1w"), componentName)}>
        <span className={cx(`${componentName}__text`)}>{title}</span>
        {actions.length !== 0 && (
          <div className={cx(`${componentName}__actions`)}>{actions}</div>
        )}
      </h3>
      <hr className={fr.cx("fr-hr")} />
    </>
  );
};

const useStyles = makeStyles()({});
