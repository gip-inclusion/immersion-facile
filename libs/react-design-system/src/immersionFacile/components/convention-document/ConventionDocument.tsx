import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import "./ConventionDocument.scss";
import { useStyles } from "tss-react/dsfr";
import Button from "@codegouvfr/react-dsfr/Button";

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
    <section className={cx(componentName)}>
      <div className={cx(`${componentName}__tools`)}>
        <Button onClick={window.print} type="button">
          Imprimer la convention
        </Button>
      </div>
      <article className={cx(`${componentName}__content`)}>
        <hr className={fr.cx("fr-hr", "fr-mb-4w")} />
        <h1 className={cx(fr.cx("fr-mb-8w"), `${componentName}__title`)}>
          {title}
        </h1>
        <hr className={fr.cx("fr-hr", "fr-mb-4w")} />
        {children}
      </article>
    </section>
  );
};
