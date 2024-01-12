import React, { useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { useStyles } from "tss-react/dsfr";
import { AgencyPublicDisplayDto } from "shared";
import { Loader } from "react-design-system";
import { makeSummarySections } from "src/app/components/forms/convention/ConventionSummarySection";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { getFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import { outOfReduxDependencies } from "src/config/dependencies";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

export const ConventionSummary = () => {
  const convention = useAppSelector(conventionSelectors.convention);
  const [agency, setAgency] = useState<AgencyPublicDisplayDto | null>(null);
  const { cx } = useStyles();
  useEffect(() => {
    if (convention) {
      outOfReduxDependencies.agencyGateway
        .getAgencyPublicInfoById({
          agencyId: convention.agencyId,
        })
        .then(setAgency)
        .catch((error) => {
          setAgency(null);
          // eslint-disable-next-line no-console
          console.error(error);
        });
    }
  }, [convention]);
  useScrollToTop(true);
  if (!convention) return null;
  if (!agency) return <Loader />;

  const fields = getFormContents(
    formConventionFieldsLabels(convention.internshipKind),
  ).getFormFields();

  return (
    <div className={cx(fr.cx("fr-col"), "im-convention-summary")}>
      {makeSummarySections(convention, agency, fields).map((section) => (
        <section
          key={section.title}
          className={cx("im-convention-summary__section")}
        >
          <h2 className={fr.cx("fr-h4")}>{section.title}</h2>
          {"fields" in section ? (
            <Table data={section.fields} noCaption fixed />
          ) : (
            section.subfields
              .filter((sub) => sub.fields.length > 0)
              .map(({ fields, subtitle }) => (
                <div key={subtitle}>
                  <p>{subtitle} </p>
                  <Table data={fields} noCaption fixed />
                </div>
              ))
          )}
        </section>
      ))}
    </div>
  );
};
