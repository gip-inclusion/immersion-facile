import { fr } from "@codegouvfr/react-dsfr";
import { Badge, type BadgeProps } from "@codegouvfr/react-dsfr/Badge";
import type { ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import { conventionSummaryStyles } from "../convention-summary/ConventionSummary.styles";
import { conventionAgencySubSectionStyles } from "./ConventionAgencySubSection.styles";

export type AgencySubSectionStructure = {
  structureName: string;
  structureCopyButton?: ReactNode;
  representedBy?: string;
  statusBadge?: BadgeProps;
};

export type AgencySubSection = {
  agencyReferent: { fullName: string };
  refersToAgency?: AgencySubSectionStructure;
  agency: AgencySubSectionStructure & {
    title: "Prescripteur lié" | "Prescripteur";
  };
};

export const ConventionAgencySubSection = ({
  agencyReferent,
  refersToAgency,
  agency,
}: AgencySubSection) => {
  const { cx } = useStyles();
  const hasAgencyReferent = !!agencyReferent.fullName.trim();
  const hasRefersToAgency = !!refersToAgency;

  const AgencyCard = ({
    title,
    structure,
    columnClassName,
  }: {
    title: string;
    structure: AgencySubSectionStructure;
    columnClassName: string;
  }) => {
    const cardClassName = hasRefersToAgency
      ? cx(
          fr.cx("fr-card", "fr-card--no-border", "fr-p-2w", "fr-m-0"),
          conventionAgencySubSectionStyles.card,
        )
      : undefined;
    return (
      <div className={columnClassName}>
        <div className={cardClassName}>
          <h4 className={fr.cx("fr-h6", "fr-mb-1w")}>{title}</h4>
          {structure.statusBadge && (
            <div className={fr.cx("fr-mb-1w")}>
              <Badge small {...structure.statusBadge} />
            </div>
          )}
          <dl>
            <dt className={fr.cx("fr-text--xs", "fr-m-0")}>Structure</dt>
            <dd
              className={cx(
                fr.cx("fr-text--sm", "fr-m-0"),
                hasRefersToAgency && fr.cx("fr-mb-2w"),
                conventionSummaryStyles.subsectionValue,
              )}
            >
              {structure.structureName}
              {structure.structureCopyButton}
            </dd>
            {structure.representedBy && (
              <>
                <dt className={fr.cx("fr-text--xs", "fr-m-0")}>
                  Représentée par
                </dt>
                <dd className={fr.cx("fr-text--sm", "fr-text--bold", "fr-m-0")}>
                  {structure.representedBy}
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>
    );
  };

  return (
    <section
      className={cx(
        fr.cx("fr-mt-2w", "fr-p-2w"),
        conventionSummaryStyles.subsectionHighlighted,
        conventionAgencySubSectionStyles.root,
      )}
    >
      {hasAgencyReferent && (
        <>
          <h3 className={fr.cx("fr-h6", "fr-mb-1w")}>
            Conseiller pour le suivi
          </h3>
          <dl className={fr.cx("fr-mb-2w")}>
            <dt className={fr.cx("fr-text--xs", "fr-m-0")}>Prénom et nom</dt>
            <dd className={fr.cx("fr-text--sm", "fr-text--bold", "fr-m-0")}>
              {agencyReferent.fullName}
            </dd>
          </dl>
          <hr className={fr.cx("fr-hr")} />
        </>
      )}
      <div className={fr.cx("fr-grid-row")}>
        {refersToAgency && (
          <AgencyCard
            columnClassName={fr.cx("fr-col-12", "fr-col-md-6", "fr-pr-1w")}
            title="Structure d'accompagnement"
            structure={refersToAgency}
          />
        )}
        <AgencyCard
          columnClassName={fr.cx(
            "fr-col-12",
            hasRefersToAgency && "fr-col-md-6",
            hasRefersToAgency && "fr-pl-1w",
          )}
          title={agency.title}
          structure={agency}
        />
      </div>
    </section>
  );
};
