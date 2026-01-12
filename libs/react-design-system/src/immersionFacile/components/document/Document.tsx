import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { cloneElement, type ReactElement, type ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import "./Document.scss";
import candidatIcon from "../../../../public/assets/images/candidat.webp";
import structureAccueilIcon from "../../../../public/assets/images/structure-accueil.webp";
import { SectionHighlight } from "../section-highlight/SectionHighlight";

const componentName = "im-convention-document";

export type ConventionDocumentProperties = {
  printButtonLabel: string;
  children: ReactNode;
  logos: ReactNode[];
  title: string;
  customActions?: ReactNode[];
  beneficiaryName: string;
  businessName: string;
  internshipKind: "immersion" | "mini-stage-cci";
};

export const Document = ({
  children,
  printButtonLabel,
  logos,
  title,
  customActions,
  beneficiaryName,
  businessName,
  internshipKind,
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
        <header>
          <div
            className={cx(fr.cx("fr-pb-4w"), `${componentName}__logos-wrapper`)}
          >
            {renderLogos()}
          </div>
          <h1
            className={cx(
              fr.cx("fr-mb-8w", "fr-h3"),
              `${componentName}__title`,
            )}
          >
            {title}
          </h1>
          <SectionHighlight>
            <div className={`${componentName}__header-row`}>
              <HeaderData
                label={`Personne en ${internshipKind === "immersion" ? "immersion" : "mini-stage"}`}
                value={beneficiaryName}
                iconSrc={candidatIcon}
              />
              <HeaderData
                label="Entreprise"
                value={businessName}
                iconSrc={structureAccueilIcon}
              />
            </div>
          </SectionHighlight>
          <hr className={fr.cx("fr-hr", "fr-mb-4w")} />
        </header>
        <main>{children}</main>
      </article>
    </section>
  );
};

const HeaderData = ({
  label,
  value,
  iconSrc,
}: {
  label: string;
  value: string;
  iconSrc: string;
}) => (
  <div className={`${componentName}__header-data`}>
    <img
      src={iconSrc}
      alt=""
      className={`${componentName}__header-icon`}
      aria-hidden="true"
    />
    <div>
      <span className={`${componentName}__header-label`}>{label}</span>
      <h2 className={fr.cx("fr-h6", "fr-mb-0")}>{value}</h2>
    </div>
  </div>
);
