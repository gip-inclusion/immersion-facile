import { fr } from "@codegouvfr/react-dsfr";
import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import type { ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import { semanticTitleToClassName } from "../../utils";
import { taskStyles } from "./Task.styles";

export type TaskProps = {
  className?: string;
  title: ReactNode;
  titleAs: "h1" | "h2" | "h3" | "h4";
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
    <section
      className={cx(
        taskStyles.container,
        "fr-mb-2v",
        className ? className : "",
      )}
    >
      <div>
        <Title
          className={cx(
            taskStyles.title,
            fr.cx("fr-mb-1w"),
            semanticTitleToClassName[titleAs],
          )}
        >
          {title}
        </Title>
        {description && <p className={fr.cx("fr-mb-1w")}>{description}</p>}
        {footer && (
          <footer className={cx(taskStyles.footer, "fr-text--sm", "fr-mb-0")}>
            {footer}
          </footer>
        )}
      </div>
      {buttonProps && <Button {...buttonProps} className={taskStyles.button} />}
    </section>
  );
};
