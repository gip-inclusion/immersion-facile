import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Table } from "@codegouvfr/react-dsfr/Table";
import React, { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { makeSummarySections } from "src/app/components/forms/convention/ConventionSummarySection";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { getFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import { agenciesSelectors } from "src/core-logic/domain/agencies/agencies.selectors";
import { agenciesSlice } from "src/core-logic/domain/agencies/agencies.slice";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { useStyles } from "tss-react/dsfr";

export const ConventionSummary = () => {
  const convention = useAppSelector(conventionSelectors.convention);
  const agency = useAppSelector(agenciesSelectors.details);
  const agencyIsLoading = useAppSelector(agenciesSelectors.isLoading);
  const agencyfeedback = useAppSelector(agenciesSelectors.feedback);
  const { cx } = useStyles();
  const dispatch = useDispatch();
  useEffect(() => {
    if (convention) {
      dispatch(
        agenciesSlice.actions.fetchAgencyInfoRequested(convention.agencyId),
      );
    }
  }, [convention, dispatch]);
  useScrollToTop(true);

  if (agencyIsLoading) return <Loader />;
  if (agencyfeedback.kind === "errored")
    return (
      <Alert
        severity="error"
        title="Erreur lors de la récupération des informations du prescripteur"
        description={agencyfeedback.errorMessage}
      />
    );
  if (!convention || !agency) return null;

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
                <div
                  key={subtitle}
                  className={cx("im-convention-summary__signatory-section")}
                >
                  <h3 className={fr.cx("fr-h6")}>{subtitle} </h3>
                  <Table data={fields} noCaption fixed />
                </div>
              ))
          )}
        </section>
      ))}
    </div>
  );
};
