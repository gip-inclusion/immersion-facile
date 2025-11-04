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
import {
  AgencyTaskList,
  NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_PAGE,
} from "src/app/components/agency/agency-dashboard/AgencyTaskList";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserConventionsToManageSelectors } from "src/core-logic/domain/connected-user/conventionsToManage/connectedUserConventionsToManage.selectors";
import { connectedUserConventionsToManageSlice } from "src/core-logic/domain/connected-user/conventionsToManage/connectedUserConventionsToManage.slice";

export const AgencyTasks = ({
  titleAs,
  onSeeAllConventionsClick,
}: {
  titleAs: TitleLevel;
  onSeeAllConventionsClick: (element: ReactNode) => void;
}) => {
  const dispatch = useDispatch();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const isLoadingConventionsToManage = useAppSelector(
    connectedUserConventionsToManageSelectors.isLoading,
  );
  const pagination = useAppSelector(
    connectedUserConventionsToManageSelectors.pagination,
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
    }
  }, [connectedUserJwt, dateStartFrom1MonthAgoToIn5Days, dispatch]);

  return (
    <HeadingSection
      title="Tâches à traiter"
      titleAs={titleAs}
      className={fr.cx("fr-mt-2w", "fr-mb-4w")}
    >
      {isLoadingConventionsToManage && <Loader />}
      {!isLoadingConventionsToManage && pagination && (
        <div className={fr.cx("fr-grid-row")}>
          <div className={fr.cx("fr-col-4")}>
            <TaskSummary
              count={pagination?.totalRecords}
              countLabel="Action urgentes"
              icon="fr-icon-edit-line"
              {...(pagination?.totalRecords > 0
                ? {
                    buttonProps: {
                      children: "Traiter cette liste",
                      onClick: () =>
                        onSeeAllConventionsClick(
                          <AgencyTaskList
                            title="Action urgentes"
                            dateRange={dateStartFrom1MonthAgoToIn5Days}
                          />,
                        ),
                    },
                  }
                : {})}
            />
          </div>
        </div>
      )}
    </HeadingSection>
  );
};
