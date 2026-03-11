import { fr } from "@codegouvfr/react-dsfr";
import { addDays, subMonths } from "date-fns";
import { type ReactNode, useEffect, useMemo } from "react";
import {
  HeadingSection,
  Loader,
  TaskSummary,
  type TitleLevel,
} from "react-design-system";
import { useDispatch } from "react-redux";
import { NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_PAGE } from "shared";
import { ConventionsToManageList } from "src/app/components/agency/agency-dashboard/ConventionsToManageList";
import {
  ConventionsWithAssessmentToCompleteList,
  threeDaysAgo,
} from "src/app/components/agency/agency-dashboard/ConventionsWithAssessmentToCompleteList";
import { ConventionsWithBroadcastErrorList } from "src/app/components/agency/agency-dashboard/ConventionsWithBroadcastErrorList";
import { hasUserRightsOnAgencyBroadcast } from "src/app/components/forms/convention/manage-actions/getButtonConfigBySubStatus";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { connectedUserConventionsToManageSelectors } from "src/core-logic/domain/connected-user/conventionsToManage/connectedUserConventionsToManage.selectors";
import { connectedUserConventionsToManageSlice } from "src/core-logic/domain/connected-user/conventionsToManage/connectedUserConventionsToManage.slice";
import { conventionsWithBroadcastFeedbackSelectors } from "src/core-logic/domain/connected-user/conventionsWithBroadcastFeedback/conventionsWithBroadcastFeedback.selectors";
import { conventionsWithBroadcastFeedbackSlice } from "src/core-logic/domain/connected-user/conventionsWithBroadcastFeedback/conventionsWithBroadcastFeedback.slice";

export const AgencyTasks = ({
  titleAs,
  onSeeAllConventionsClick,
}: {
  titleAs: TitleLevel;
  onSeeAllConventionsClick: (element: ReactNode) => void;
}) => {
  const dispatch = useDispatch();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);

  const isLoadingConventionsToManage = useAppSelector(
    connectedUserConventionsToManageSelectors.isLoading,
  );
  const isLoadingConventionsWithAssessmentIssue = useAppSelector(
    connectedUserConventionsToManageSelectors.isLoadingConventionsWithAssessmentIssue,
  );
  const isLoadingConventionsWithBroadcastError = useAppSelector(
    conventionsWithBroadcastFeedbackSelectors.isLoading,
  );
  const conventionsToManagePagination = useAppSelector(
    connectedUserConventionsToManageSelectors.pagination,
  );
  const conventionsWithAssessmentIssuePagination = useAppSelector(
    connectedUserConventionsToManageSelectors.conventionsWithAssessmentIssuePagination,
  );
  const conventionsWithErroredBroadcastFeedbackPagination = useAppSelector(
    conventionsWithBroadcastFeedbackSelectors.erroredBroadcastConventionsWithPagination,
  );
  const dateStartFrom1MonthAgoToIn5Days = useMemo(
    () => ({
      dateStartFrom: subMonths(new Date(), 1).toISOString(),
      dateStartTo: addDays(new Date(), 5).toISOString(),
    }),
    [],
  );

  useEffect(() => {
    if (connectedUserJwt) {
      dispatch(
        connectedUserConventionsToManageSlice.actions.getConventionsForConnectedUserRequested(
          {
            params: {
              ...dateStartFrom1MonthAgoToIn5Days,
              sortBy: "dateStart",
              sortDirection: "asc",
              statuses: [
                "READY_TO_SIGN",
                "PARTIALLY_SIGNED",
                "IN_REVIEW",
                "ACCEPTED_BY_COUNSELLOR",
              ],
              page: 1,
              perPage: NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_PAGE,
            },
            jwt: connectedUserJwt,
            feedbackTopic: "connected-user-conventions",
          },
        ),
      );
      dispatch(
        connectedUserConventionsToManageSlice.actions.getConventionsWithAssessmentIssueRequested(
          {
            params: {
              sortBy: "dateStart",
              sortDirection: "desc",
              assessmentCompletionStatus: ["to-be-completed", "to-sign"],
              dateEndTo: threeDaysAgo,
              page: 1,
              perPage: NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_PAGE,
            },
            jwt: connectedUserJwt,
            feedbackTopic: "conventions-with-assessment-issue",
          },
        ),
      );
      dispatch(
        conventionsWithBroadcastFeedbackSlice.actions.getConventionsWithErroredBroadcastFeedbackRequested(
          {
            filters: {
              page: 1,
              perPage: NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_PAGE,
              broadcastErrorKind: "functional",
            },
            jwt: connectedUserJwt,
            feedbackTopic: "conventions-with-broadcast-feedback",
          },
        ),
      );
    }
  }, [connectedUserJwt, dateStartFrom1MonthAgoToIn5Days, dispatch]);

  return (
    <HeadingSection
      title="Tâches à traiter"
      titleAs={titleAs}
      className={fr.cx("fr-mt-2w", "fr-mb-4w")}
    >
      {(isLoadingConventionsToManage ||
        isLoadingConventionsWithAssessmentIssue ||
        isLoadingConventionsWithBroadcastError) && <Loader />}
      {conventionsToManagePagination?.totalRecords === 0 &&
        conventionsWithAssessmentIssuePagination?.totalRecords === 0 &&
        conventionsWithErroredBroadcastFeedbackPagination.pagination
          .totalRecords === 0 && <p>Aucune tâche à traiter.</p>}
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        {!isLoadingConventionsToManage &&
          conventionsToManagePagination?.totalRecords !== undefined &&
          conventionsToManagePagination.totalRecords > 0 && (
            <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
              <TaskSummary
                count={conventionsToManagePagination.totalRecords}
                countLabel="Actions urgentes"
                icon="fr-icon-edit-line"
                buttonProps={{
                  children: "Traiter cette liste",
                  onClick: () =>
                    onSeeAllConventionsClick(
                      <ConventionsToManageList
                        title="Actions urgentes"
                        dateRange={dateStartFrom1MonthAgoToIn5Days}
                      />,
                    ),
                }}
              />
            </div>
          )}
        {!isLoadingConventionsWithAssessmentIssue &&
          conventionsWithAssessmentIssuePagination?.totalRecords !==
            undefined &&
          conventionsWithAssessmentIssuePagination.totalRecords > 0 && (
            <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
              <TaskSummary
                count={conventionsWithAssessmentIssuePagination.totalRecords}
                countLabel="Bilans à compléter"
                icon="fr-icon-file-text-line"
                buttonProps={{
                  children: "Traiter cette liste",
                  onClick: () =>
                    onSeeAllConventionsClick(
                      <ConventionsWithAssessmentToCompleteList title="Relances bilans" />,
                    ),
                }}
              />
            </div>
          )}
        {!isLoadingConventionsWithBroadcastError &&
          currentUser &&
          hasUserRightsOnAgencyBroadcast(currentUser) &&
          conventionsWithErroredBroadcastFeedbackPagination?.pagination
            ?.totalRecords !== undefined &&
          conventionsWithErroredBroadcastFeedbackPagination.pagination
            .totalRecords > 0 && (
            <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
              <TaskSummary
                count={
                  conventionsWithErroredBroadcastFeedbackPagination.pagination
                    .totalRecords
                }
                countLabel="Conventions à vérifier"
                icon="fr-icon-link-unlink"
                buttonProps={{
                  children: "Traiter cette liste",
                  onClick: () =>
                    onSeeAllConventionsClick(
                      <ConventionsWithBroadcastErrorList title="Conventions à vérifier" />,
                    ),
                }}
              />
            </div>
          )}
      </div>
    </HeadingSection>
  );
};
