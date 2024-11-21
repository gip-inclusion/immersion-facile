import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import React, { ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import { CopyButton } from "../copy-button/CopyButton";
import { conventionSummaryStyles } from "./ConventionSummary.styles";

export type ConventionSummaryProperties = {
  conventionId?: string;
  submittedAt: string;
  summary: ConventionSummarySection[];
};

export type ConventionSummarySection = {
  title: string;
  subSections: ConventionSummarySubSection[];
};

export type ConventionSummarySubSection = {
  key: string;
  title?: string;
  fields: ConventionSummaryField[];
  isFullWidthDisplay?: boolean;
  hasBackgroundColor?: boolean;
  isSchedule?: boolean;
};

export type ConventionSummaryField = { key: string } & (
  | {
      label: string;
      value: string | ReactNode;
      copyButton?: string | ReactNode;
      hasBackgroundColor?: boolean;
    }
  | {
      value: string | ReactNode;
      badgeSeverity: "success" | "warning";
    }
  | { value: ReactNode }
);

export const ConventionSummary = ({
  conventionId,
  submittedAt,
  summary,
}: ConventionSummaryProperties) => {
  const { cx } = useStyles();

  const isNextSubsectionFullwidth = (
    subsections: ConventionSummarySubSection[],
    index: number,
  ): boolean => {
    const nextSubsection = subsections.at(index + 1);

    if (!nextSubsection) return false;
    return !!nextSubsection.isFullWidthDisplay;
  };

  return (
    <>
      {conventionId && (
        <section
          className={cx(
            fr.cx("fr-grid-row", "fr-mb-3w", "fr-p-2w"),
            conventionSummaryStyles.section,
            conventionSummaryStyles.sectionFluid,
          )}
        >
          <div className={fr.cx("fr-grid-row")}>
            <img
              src="https://immersion.cellar-c2.services.clever-cloud.com/document_administratif"
              alt=""
              className={fr.cx("fr-mr-3v")}
            />
            <div>
              <h4 className={fr.cx("fr-mb-0")}>Convention</h4>
              <div className={fr.cx("fr-text--xs", "fr-mb-2v")}>
                Date de soumission : {submittedAt}
              </div>
              <div>
                <span className={cx(conventionSummaryStyles.sectionId)}>
                  ID :{" "}
                </span>
                {conventionId}
              </div>
            </div>
          </div>
          <CopyButton
            label="Copier l'ID de convention"
            textToCopy={conventionId}
            withIcon={true}
            withBorder={true}
          />
        </section>
      )}
      {summary.map((section) => (
        <section
          className={cx(
            fr.cx("fr-mb-3w", "fr-p-2w"),
            conventionSummaryStyles.section,
          )}
          key={section.title}
        >
          <h4 className={fr.cx("fr-mt-3v", "fr-mb-2v", "fr-mb-0")}>
            {section.title}
          </h4>
          <div className={fr.cx("fr-grid-row")}>
            {section.subSections.map((subSection, index) => {
              return (
                <SubSection
                  key={subSection.key}
                  subSection={subSection}
                  index={index}
                  isNextSubsectionFullwidth={isNextSubsectionFullwidth(
                    section.subSections,
                    index,
                  )}
                />
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
};

const SubSection = ({
  subSection,
  index,
  isNextSubsectionFullwidth,
}: {
  subSection: ConventionSummarySubSection;
  index: number;
  isNextSubsectionFullwidth: boolean;
}) => {
  const { cx } = useStyles();

  return (
    <>
      {shouldDisplayHorizontalSeparator(
        index,
        !!subSection.hasBackgroundColor,
        !!subSection.isFullWidthDisplay,
      ) && (
        <div
          className={cx(
            fr.cx("fr-my-2w"),
            conventionSummaryStyles.subsectionHorizontalSeparator,
          )}
        />
      )}
      <section
        key={subSection.title}
        className={cx(
          fr.cx(
            "fr-col-12",
            "fr-pr-3w",
            !!subSection.title && "fr-py-2w",
            !subSection.isFullWidthDisplay && "fr-col-md-6",
            subSection.hasBackgroundColor && "fr-p-2w",
          ),
          conventionSummaryStyles.subsection,
          subSection.hasBackgroundColor &&
            conventionSummaryStyles.subsectionHighlighted,
          shouldDisplayVerticalSeparator(
            index,
            !!subSection.isFullWidthDisplay,
            isNextSubsectionFullwidth,
          ) && conventionSummaryStyles.subsectionVerticalSeparator,
        )}
      >
        <div className={fr.cx("fr-col-12")}>
          {subSection.title && (
            <h6 className={fr.cx("fr-mb-2v")}>{subSection.title}</h6>
          )}
          {subSection.isSchedule && <Schedule fields={subSection.fields} />}
          {!subSection.isSchedule && (
            <div className={fr.cx("fr-grid-row")}>
              {subSection.fields.map((field) => {
                if ("badgeSeverity" in field) {
                  return (
                    <div
                      key={field.key}
                      className={fr.cx("fr-col-12", "fr-mb-2w")}
                    >
                      <Badge severity={field.badgeSeverity}>
                        {field.badgeSeverity === "success" ? (
                          <>field.value</>
                        ) : (
                          "Signature en attente"
                        )}
                      </Badge>
                    </div>
                  );
                }
                return (
                  <div
                    className={fr.cx("fr-col-12", "fr-col-md-6", "fr-my-1w")}
                    key={field.key}
                  >
                    {"label" in field && (
                      <div className={fr.cx("fr-text--xs", "fr-m-0")}>
                        <div className={fr.cx("fr-text--xs", "fr-m-0")}>
                          {field.label}
                        </div>
                        <div
                          className={cx(
                            conventionSummaryStyles.subsectionValue,
                          )}
                        >
                          {field.value}
                          {field.copyButton}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

const Schedule = ({ fields }: { fields: ConventionSummaryField[] }) => {
  return (
    <>
      {fields
        .filter((field) => !!field)
        .map((field) => {
          return <span key={field.key}>{field.value}</span>;
        })}
    </>
  );
};

const shouldDisplayHorizontalSeparator = (
  index: number,
  hasBackgroundColor: boolean,
  isFullWidthDisplay: boolean,
) => {
  if (hasBackgroundColor) return false;
  if (isFullWidthDisplay) return true;
  return index % 2 === 0;
};

const shouldDisplayVerticalSeparator = (
  index: number,
  isFullWidthDisplay: boolean,
  isNextSubsectionFullWidth: boolean,
) => {
  if (isFullWidthDisplay || isNextSubsectionFullWidth) return false;
  return index % 2 === 0;
};
