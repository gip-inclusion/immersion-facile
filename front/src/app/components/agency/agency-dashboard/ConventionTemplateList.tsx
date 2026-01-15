import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { HeadingSection, HorizontalCard } from "react-design-system";

type ConventionTemplate = {
  id: string;
  name: string;
  updatedAt: Date;
  sharesCount: number;
  usesCount: number;
};

const mockTemplates: ConventionTemplate[] = [
  {
    id: "1",
    name: "Nom du modèle",
    updatedAt: new Date("2025-10-29T16:00:00"),
    sharesCount: 7,
    usesCount: 3,
  },
  {
    id: "2",
    name: "Convention Job Dating de Paris",
    updatedAt: new Date("2025-10-29T16:00:00"),
    sharesCount: 7,
    usesCount: 3,
  },
  {
    id: "3",
    name: "Convention Job Dating de Paris",
    updatedAt: new Date("2025-10-29T16:00:00"),
    sharesCount: 7,
    usesCount: 3,
  },
];

const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} à ${hours}h${minutes}`;
};

const ConventionTemplateCard = ({
  template,
}: {
  template: ConventionTemplate;
}) => {
  return (
    <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
      <article className={fr.cx("fr-card", "fr-p-3w")}>
        <div
          className={fr.cx(
            "fr-grid-row",
            "fr-grid-row--middle",
            "fr-grid-row--gutters",
          )}
        >
          <div className={fr.cx("fr-col-12", "fr-col-lg-7")}>
            <p className={fr.cx("fr-text--bold", "fr-mb-1v")}>
              {template.name}
            </p>
            <p className={fr.cx("fr-text--sm", "fr-mb-1v")}>
              Mise à jour : {formatDate(template.updatedAt)}
            </p>
            <p className={fr.cx("fr-text--sm", "fr-mb-0")}>
              <span
                className={fr.cx("fr-icon-file-text-line", "fr-icon--sm")}
                aria-hidden="true"
              />{" "}
              {template.sharesCount} partages / {template.usesCount}{" "}
              utilisations
            </p>
          </div>
          <div className={fr.cx("fr-col-12", "fr-col-lg-5")}>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.5rem",
              }}
            >
              <Button
                priority="secondary"
                iconId="fr-icon-edit-line"
                iconPosition="right"
                onClick={() => {}}
              >
                Modifier
              </Button>
              <Button
                priority="secondary"
                iconId="fr-icon-delete-bin-line"
                title="Supprimer"
                onClick={() => {}}
              />
            </div>
            <div className={fr.cx("fr-mt-1w")} style={{ textAlign: "right" }}>
              <Button
                priority="tertiary no outline"
                iconId="fr-icon-send-plane-line"
                iconPosition="right"
                onClick={() => {}}
              >
                Partager
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export const ConventionTemplateList = () => {
  return (
    <HeadingSection
      title="Mes modèles de conventions"
      titleAs="h3"
      className={fr.cx("fr-mt-4w")}
      titleAction={
        <Button priority="primary" iconId="fr-icon-add-line" onClick={() => {}}>
          Créer un modèle
        </Button>
      }
    >
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        {mockTemplates.map((template) => (
          <ConventionTemplateCard key={template.id} template={template} />
        ))}
      </div>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        {mockTemplates.map((template) => (
          <div className={fr.cx("fr-col-12", "fr-col-lg-6")} key={template.id}>
            <HorizontalCard
              title={template.name}
              titleAs="h4"
              description={`${template.sharesCount} partages / ${template.usesCount} utilisations`}
              footer={`Mise à jour : ${formatDate(template.updatedAt)}`}
            />
          </div>
        ))}
      </div>
    </HeadingSection>
  );
};
