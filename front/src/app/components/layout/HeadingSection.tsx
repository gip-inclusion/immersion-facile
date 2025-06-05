import { fr } from "@codegouvfr/react-dsfr";

export const HeadingSection = ({
  title,
  titleAction,
  description,
  children,
}: {
  title: string;
  titleAction?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <section className={fr.cx("fr-mt-6w", "fr-mb-4w")}>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--middle")}>
        <h3 className={fr.cx("fr-h6", !!description && "fr-mb-1w")}>{title}</h3>
        {titleAction && (
          <div className={fr.cx("fr-ml-auto")}>{titleAction}</div>
        )}
      </div>
      {description && <p className={fr.cx("fr-mb-2w")}>{description}</p>}

      {children}
    </section>
  );
};
