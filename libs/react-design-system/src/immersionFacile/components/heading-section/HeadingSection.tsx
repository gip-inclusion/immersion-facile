import { type FrClassName, fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

export type HeadingSectionProps = {
  title: string;
  titleAction?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleActionCols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  titleAs?: "h1" | "h2" | "h3" | "h4";
};

const semanticTitleToClassName: Record<
  NonNullable<HeadingSectionProps["titleAs"]>,
  FrClassName
> = {
  h1: "fr-h5",
  h2: "fr-h5",
  h3: "fr-h6",
  h4: "fr-h6",
};

export const HeadingSection = ({
  title,
  titleAction,
  description,
  children,
  className,
  titleActionCols,
  titleAs = "h3",
}: HeadingSectionProps) => {
  const defaultClassName = "fr-mt-6w fr-mb-4w";
  const { cx } = useStyles();
  const Title = titleAs;
  return (
    <section className={cx(className ? className : defaultClassName)}>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--middle")}>
        <Title
          className={fr.cx(
            titleAs && semanticTitleToClassName[titleAs],
            !!description && "fr-mb-1w",
          )}
        >
          {title}
        </Title>
        {titleAction && (
          <div
            className={fr.cx(
              "fr-ml-auto",
              titleActionCols && `fr-col-${titleActionCols}`,
            )}
          >
            {titleAction}
          </div>
        )}
      </div>
      {description && <p className={fr.cx("fr-mb-2w")}>{description}</p>}

      {children}
    </section>
  );
};
