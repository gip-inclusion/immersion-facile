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
  const isLoadingConventionsWithBroadcastError = useAppSelector(
    conventionsWithBroadcastFeedbackSelectors.isLoading,
  );
  const conventionsToManagePagination = useAppSelector(
    connectedUserConventionsToManageSelectors.pagination,
  );
  const conventionsWithErroredBroadcastFeedbackPagination = useAppSelector(
    conventionsWithBroadcastFeedbackSelectors.pagination,
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
        conventionsWithBroadcastFeedbackSlice.actions.getConventionsWithErroredBroadcastFeedbackRequested(
          {
            params: {
              page: 1,
              perPage: NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_PAGE,
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
        isLoadingConventionsWithBroadcastError) && <Loader />}
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
        {!isLoadingConventionsWithBroadcastError &&
          currentUser &&
          hasUserRightsOnAgencyBroadcast(currentUser) &&
          conventionsWithErroredBroadcastFeedbackPagination?.totalRecords !==
            undefined &&
          conventionsWithErroredBroadcastFeedbackPagination.totalRecords >
            0 && (
            <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
              <TaskSummary
                count={
                  conventionsWithErroredBroadcastFeedbackPagination.totalRecords
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
