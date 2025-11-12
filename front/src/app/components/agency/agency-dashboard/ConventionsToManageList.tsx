import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import { useCallback, useMemo } from "react";
import { HeadingSection, Task } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type ConventionDto,
  getDaysBetween,
  getFormattedFirstnameAndLastname,
  NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_PAGE,
  relativeTimeFormat,
} from "shared";
import { labelAndSeverityByStatus } from "src/app/contents/convention/labelAndSeverityByStatus";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserConventionsToManageSelectors } from "src/core-logic/domain/connected-user/conventionsToManage/connectedUserConventionsToManage.selectors";
import { connectedUserConventionsToManageSlice } from "src/core-logic/domain/connected-user/conventionsToManage/connectedUserConventionsToManage.slice";
import { match, P } from "ts-pattern";

export const ConventionsToManageList = ({
  title,
  dateRange,
}: {
  title: string;
  dateRange: { dateStartFrom: string; dateStartTo: string };
}) => {
  const dispatch = useDispatch();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const currentUserConventions = useAppSelector(
    connectedUserConventionsToManageSelectors.conventions,
  );
  const pagination = useAppSelector(
    connectedUserConventionsToManageSelectors.pagination,
  );
  const dateStartFrom1MonthAgoToIn5Days = useMemo(() => dateRange, [dateRange]);

  const getConventionsForConnectedUserRequested = useCallback(
    (page: number) => {
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
                page,
                perPage: NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_PAGE,
              },
              jwt: connectedUserJwt,
              feedbackTopic: "connected-user-conventions",
            },
          ),
        );
      }
    },
    [connectedUserJwt, dateStartFrom1MonthAgoToIn5Days, dispatch],
  );

  const onPaginationClick = useCallback(
    (pageNumber: number) => {
      getConventionsForConnectedUserRequested(pageNumber);
    },
    [getConventionsForConnectedUserRequested],
  );

  return (
    <HeadingSection
      title={title}
      titleAs="h2"
      className={fr.cx("fr-mt-2w", "fr-mb-4w")}
    >
      {currentUserConventions?.length === 0 && (
        <p>Aucune convention à traiter en urgence.</p>
      )}
      {currentUserConventions.map((convention) => (
        <AgencyTaskItem key={convention.id} convention={convention} />
      ))}
      {pagination &&
        pagination?.totalRecords > NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_PAGE && (
          <Pagination
            className={fr.cx("fr-mt-3w")}
            count={pagination.totalPages}
            defaultPage={pagination.currentPage}
            getPageLinkProps={(pageNumber) => ({
              title: `Résultats de recherche, page : ${pageNumber}`,
              href: "#",
              key: `page-${pageNumber}`,
              onClick: (event) => {
                event.preventDefault();
                onPaginationClick(pageNumber);
              },
            })}
          />
        )}
    </HeadingSection>
  );
};

const AgencyTaskItem = ({ convention }: { convention: ConventionDto }) => {
  const title = (
    <>
      <span className={fr.cx("fr-pr-2v")}>
        {convention.signatories.beneficiary.firstName}{" "}
        {convention.signatories.beneficiary.lastName}{" "}
      </span>
      <Badge className={labelAndSeverityByStatus[convention.status].color}>
        {labelAndSeverityByStatus[convention.status].label}
      </Badge>
    </>
  );
  const footer = convention.signatories.beneficiary.federatedIdentity
    ?.provider === "peConnect" &&
    convention.signatories.beneficiary.federatedIdentity?.payload && (
      <>
        Conseiller :{" "}
        {getFormattedFirstnameAndLastname({
          firstname:
            convention.signatories.beneficiary.federatedIdentity.payload.advisor
              ?.firstName,
          lastname:
            convention.signatories.beneficiary.federatedIdentity.payload.advisor
              ?.lastName,
        })}
      </>
    );
  const immersionStartedSinceDays = getDaysBetween(
    new Date(),
    new Date(convention.dateStart),
  );

  const description = match({ immersionStartedSinceDays })
    .with({ immersionStartedSinceDays: P.when((days) => days < -2) }, () => (
      <>
        ⚠️ L'immersion a déjà commencé{" "}
        <strong>
          {relativeTimeFormat.format(immersionStartedSinceDays, "day")}
        </strong>
      </>
    ))
    .with(
      { immersionStartedSinceDays: P.when((days) => days >= -2 && days <= 0) },
      () => (
        <>
          ⚠️ L'immersion a commencé{" "}
          <strong>
            {relativeTimeFormat.format(immersionStartedSinceDays, "day")}
          </strong>
        </>
      ),
    )
    .with({ immersionStartedSinceDays: P.when((days) => days > 0) }, () => (
      <>
        <Badge className={fr.cx("fr-badge--error")}>
          J-{immersionStartedSinceDays}
        </Badge>{" "}
        L'immersion commence{" "}
        <strong>
          {relativeTimeFormat.format(immersionStartedSinceDays, "day")}
        </strong>
      </>
    ))
    .run();

  return (
    <Task
      title={title}
      titleAs="h3"
      description={description}
      footer={footer}
      buttonProps={{
        children: "Piloter",
        priority: "secondary",
        size: "medium",
        linkProps: {
          target: "_blank",
          rel: "noreferrer",
          href: routes.manageConventionConnectedUser({
            conventionId: convention.id,
          }).link.href,
        },
      }}
    />
  );
};
