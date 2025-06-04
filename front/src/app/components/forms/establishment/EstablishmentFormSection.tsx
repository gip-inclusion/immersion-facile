import { fr } from "@codegouvfr/react-dsfr";

export const EstablishmentFormSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <section className={fr.cx("fr-mb-4w")}>
      <h3 className={fr.cx("fr-h6", !!description && "fr-mb-1w")}>{title}</h3>
      {description && <p className={fr.cx("fr-mb-2w")}>{description}</p>}

      {children}
    </section>
  );
};
