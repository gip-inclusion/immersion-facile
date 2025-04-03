import { fr } from "@codegouvfr/react-dsfr";
import type { ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./PageHeader.styles";

export type PageHeaderProps = {
  title: string;
  illustration?: string;
  className?: string;
  children?: ReactNode;
  classes?: Partial<Record<"root" | "description" | "inner" | "title", string>>;
  breadcrumbs?: ReactNode;
  badge?: ReactNode;
};

export const PageHeader = ({
  title,
  className,
  children,
  illustration,
  classes = {},
  breadcrumbs,
  badge,
}: PageHeaderProps) => {
  const { cx } = useStyles();
  const textContent = (
    <>
      {badge}
      <h1 className={cx(children ? "" : "fr-my-auto", classes.title)}>
        {title}
      </h1>
      {children}
    </>
  );
  return (
    <section
      className={cx(
        fr.cx("fr-pt-1w", "fr-pb-2w"),
        Styles.root,
        ` ${className ?? ""}`,
        classes.root,
      )}
      aria-label="En-tête de page"
    >
      {breadcrumbs && (
        <div className={cx(Styles.breadcrumbsWrapper)}>{breadcrumbs}</div>
      )}
      <div className={cx(fr.cx("fr-container", "fr-mt-8w"), classes.inner)}>
        {illustration && (
          <div className={fr.cx("fr-grid-row")}>
            <div className={fr.cx("fr-col-12", "fr-col-lg-8")}>
              {textContent}
            </div>
            <div className={fr.cx("fr-col-12", "fr-col-lg-4", "fr-px-1w")}>
              <img src={illustration} alt="" />
            </div>
          </div>
        )}
        {!illustration && textContent}
      </div>
    </section>
  );
};
