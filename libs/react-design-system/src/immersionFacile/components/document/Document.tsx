import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Avatar from "@codegouvfr/react-dsfr/picto/Avatar";
import Companie from "@codegouvfr/react-dsfr/picto/Companie";
import { cloneElement, type ReactElement, type ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import "./Document.scss";

const componentName = "im-convention-document";

export type ConventionDocumentProperties = {
  printButtonLabel: string;
  children: ReactNode;
  logos: ReactNode[];
  title: string;
  customActions?: ReactNode[];
};

export const Document = ({
  children,
  printButtonLabel,
  logos,
  title,
  customActions,
}: ConventionDocumentProperties) => {
  const { cx } = useStyles();
  const renderLogos = () =>
    logos?.map((logo: ReactNode, index) => {
      const LogoElement = logo as ReactElement;
      const LogoElementWithClassName = cloneElement(LogoElement, {
        className: cx(`${componentName}__logo`),
        // biome-ignore lint/suspicious/noArrayIndexKey: Index is ok here
        key: `${componentName}__logo-${index}`,
      });
      return LogoElementWithClassName;
    });
  return (
    <section className={cx(componentName)}>
      <div className={cx(`${componentName}__tools`)}>
        {customActions}
        <Button
          onClick={window.print}
          type="button"
          id={"im-convention-document__print-button"}
        >
          {printButtonLabel}
        </Button>
      </div>
      <article className={cx(`${componentName}__content`)}>
        <header className={cx(fr.cx("fr-mb-4w"))}>
          <div
            className={cx(fr.cx("fr-pb-4w"), `${componentName}__logos-wrapper`)}
          >
            {renderLogos()}
          </div>
          <h1 className={cx(fr.cx("fr-h4"), `${componentName}__title`)}>
            {title}
          </h1>
          <DocumentHeader />
        </header>
        <main>{children}</main>
      </article>
    </section>
  );
};

const DocumentHeader = () => {
  return (
    <div
      style={{
        backgroundColor: "lightblue",
        height: "54px",
        marginLeft: "16px",
      }}
    >
      <Avatar />
      <dl>
        <dt className={fr.cx("fr-text--xs", "fr-m-0")}>
          Personne en immersion
        </dt>
        <dd className={fr.cx("fr-text--sm", "fr-m-0", "fr-mr-2w")}>
          Truc à fournir
        </dd>
      </dl>

      <Companie />
    </div>
  );
};
