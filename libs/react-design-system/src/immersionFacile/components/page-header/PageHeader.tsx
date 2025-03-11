import { fr } from "@codegouvfr/react-dsfr";
import type { ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./PageHeader.styles";

export type PageHeaderProps = {
  title: string;
  className?: string;
  children?: ReactNode;
  classes?: Partial<Record<"root" | "inner" | "title", string>>;
  breadcrumbs?: ReactNode;
  badge?: ReactNode;
};

export const PageHeader = ({
  title,
  className,
  children,
  classes = {},
  breadcrumbs,
  badge,
}: PageHeaderProps) => {
  const { cx } = useStyles();
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
        {badge}
        <h1 className={cx(children ? "" : "fr-my-auto", classes.title)}>
          {title}
        </h1>
        {children}
      </div>
    </section>
  );
};
