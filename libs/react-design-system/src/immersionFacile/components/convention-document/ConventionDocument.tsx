import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import "./ConventionDocument.scss";
import { useStyles } from "tss-react/dsfr";

const componentName = "im-convention-document";

export const ConventionDocument = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: React.ReactNode;
}) => {
  const { cx } = useStyles();
  return (
    <article className={cx(componentName)}>
      <hr className={fr.cx("fr-hr", "fr-mb-4w")} />
      <h1 className={cx(fr.cx("fr-mb-8w"), `${componentName}__title`)}>
        {title}
      </h1>
      <hr className={fr.cx("fr-hr", "fr-mb-4w")} />
      {children}
    </article>
  );
};
