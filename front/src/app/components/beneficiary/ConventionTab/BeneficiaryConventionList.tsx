import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import { Fragment, useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch, useSelector } from "react-redux";
import { type BeneficiaryConventionListDto, domElementIds } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionListSelectors } from "src/core-logic/domain/connected-user/conventionList/connectedUserConventionList.selectors";
import { conventionListSlice } from "src/core-logic/domain/connected-user/conventionList/connectedUserConventionList.slice";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { ConventionAssessmentStatusBadge } from "../../convention/ConventionAssessmentStatusBadge";
import { ConventionDatesDisplay } from "../../convention/ConventionDatesDisplay";
import { ConventionStatusBadge } from "../../convention/ConventionStatusBadge";
import { WithFeedbackReplacer } from "../../feedback/WithFeedbackReplacer";

export const BeneficiaryConventionList = (): React.ReactNode => {
  const feedbackTopic: FeedbackTopic =
    "connected-user-beneficiaryConventionList";
  const dispatch = useDispatch();
  const jwt = useAppSelector(authSelectors.connectedUserJwt);
  const beneficiaryConventionList = useSelector(
    conventionListSelectors.beneficiaryConventionList,
  );
  const isLoading = useSelector(conventionListSelectors.isLoading);

  useEffect(() => {
    if (jwt && !isLoading && beneficiaryConventionList === null)
      dispatch(
        conventionListSlice.actions.fetchBeneficiaryConventionListRequested({
          jwt,
          feedbackTopic,
        }),
      );
  }, [jwt, isLoading, dispatch, beneficiaryConventionList]);

  useEffect(
    () => () => {
      dispatch(
        conventionListSlice.actions.clearBeneficiaryConventionListRequested(),
      );
      dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
    },
    [dispatch],
  );

  return (
    <>
      {isLoading && <Loader />}
      <h1>Conventions</h1>
      <WithFeedbackReplacer topic={feedbackTopic} level="error" />
      {beneficiaryConventionList !== null && (
        <Table
          id={
            domElementIds.beneficiaryDashboardConventions
              .beneficiaryConventionListTable
          }
          fixed
          headers={["Entreprise", "Statut", "Bilan", "Dates", "Actions"]}
          data={conventionListToTableData(beneficiaryConventionList)}
        />
      )}
    </>
  );
};

const conventionListToTableData = (
  conventionList: BeneficiaryConventionListDto,
): React.ReactNode[][] =>
  conventionList.map<React.ReactNode[]>((convention) => [
    convention.businessName,
    <Fragment key={convention.conventionId}>
      <ConventionStatusBadge
        conventionStatus={convention.status}
        userKind="beneficiary"
      />
    </Fragment>,
    <Fragment key={convention.conventionId}>
      <ConventionAssessmentStatusBadge
        conventionParams={convention}
        userKind="beneficiary"
      />
    </Fragment>,
    <Fragment key={convention.conventionId}>
      <ConventionDatesDisplay convention={convention} />
    </Fragment>,
    <Button disabled key={convention.conventionId}>
      Voir la convention
    </Button>,
  ]);
