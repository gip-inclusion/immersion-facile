import { fr } from "@codegouvfr/react-dsfr";
import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import type { ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import { dashboardTitleToClassName, type TitleLevel } from "../../utils";
import { taskStyles } from "./Task.styles";

export type TaskProps = {
  className?: string;
  title: ReactNode;
  titleAs: TitleLevel;
  description: ReactNode;
  buttonProps?: ButtonProps;
  footer?: ReactNode;
};

export const Task = ({
  title,
  titleAs,
  description,
  className,
  buttonProps,
  footer,
}: TaskProps) => {
  const { cx } = useStyles();
  const Title = titleAs;

  return (
    <article
      className={cx(
        fr.cx("fr-card", "fr-container", "fr-mb-2v", "fr-p-4v"),
        className ? className : "",
      )}
    >
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-10")}>
          <Title
            className={cx(
              fr.cx("fr-grid-row", "fr-mb-1w"),
              dashboardTitleToClassName[titleAs],
            )}
          >
            {title}
          </Title>
          {description && <p className={fr.cx("fr-mb-2v")}>{description}</p>}
          {footer && (
            <footer
              className={cx(taskStyles.footer, "fr-text--sm", "fr-mb-2v")}
            >
              {footer}
            </footer>
          )}
        </div>
        <div
          className={fr.cx("fr-col-md-2", "fr-grid-row", "fr-grid-row--right")}
        >
          {buttonProps && (
            <Button {...buttonProps} className={cx(taskStyles.button)} />
          )}
        </div>
      </div>
    </article>
  );
};
