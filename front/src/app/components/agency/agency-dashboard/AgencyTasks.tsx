import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import { addDays, differenceInCalendarDays, subMonths } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { HeadingSection, Task } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type ConventionDto,
  convertLocaleDateToUtcTimezoneDate,
  getFormattedFirstnameAndLastname,
} from "shared";
import { labelAndSeverityByStatus } from "src/app/contents/convention/labelAndSeverityByStatus";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserConventionsSelectors } from "src/core-logic/domain/connected-user/conventions/connectedUserConventions.selectors";
import { connectedUserConventionsSlice } from "src/core-logic/domain/connected-user/conventions/connectedUserConventions.slice";
import { match, P } from "ts-pattern";

const NUMBER_ITEM_TO_DISPLAY_IN_LIMITED_MODE = 3;
const NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_MODE = 10;

export const AgencyTasks = ({
  titleAs,
  displayMode,
  onSeeAllConventionsClick,
}: {
  titleAs: "h1" | "h2" | "h3" | "h4";
  displayMode: "limited" | "paginated";
  onSeeAllConventionsClick?: () => void;
}) => {
  const dispatch = useDispatch();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const currentUserConventions = useAppSelector(
    connectedUserConventionsSelectors.conventions,
  );
  const pagination = useAppSelector(
    connectedUserConventionsSelectors.pagination,
  );
  const [conventionsDisplayed, setConventionsDisplayed] = useState<
    ConventionDto[]
  >([]);

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
        connectedUserConventionsSlice.actions.getConventionsForConnectedUserRequested(
          {
            params: {
              ...dateStartFrom1MonthAgoToIn5Days,
              sortBy: "dateStart",
              sortOrder: "asc",
              page: 1,
              perPage: NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_MODE,
            },
            jwt: connectedUserJwt,
            feedbackTopic: "connected-user-conventions",
          },
        ),
      );
    }
  }, [dispatch, connectedUserJwt, dateStartFrom1MonthAgoToIn5Days]);

  useEffect(() => {
    setConventionsDisplayed(
      currentUserConventions.slice(
        0,
        displayMode === "limited"
          ? NUMBER_ITEM_TO_DISPLAY_IN_LIMITED_MODE
          : currentUserConventions.length,
      ),
    );
  }, [currentUserConventions, displayMode]);

  const onPaginationClick = (page: number) => {
    if (connectedUserJwt) {
      dispatch(
        connectedUserConventionsSlice.actions.getConventionsForConnectedUserRequested(
          {
            params: {
              ...dateStartFrom1MonthAgoToIn5Days,
              sortBy: "dateStart",
              sortOrder: "asc",
              page: page,
              perPage: NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_MODE,
            },
            jwt: connectedUserJwt,
            feedbackTopic: "connected-user-conventions",
          },
        ),
      );
    }
  };

  return (
    <HeadingSection
      title="Tâches à traiter"
      titleAs={titleAs}
      className={fr.cx("fr-mt-2w", "fr-mb-1w")}
    >
      {pagination?.totalRecords === 0 && (
        <p>Aucune convention à traiter en urgence.</p>
      )}
      {pagination?.totalRecords &&
        pagination?.totalRecords > 3 &&
        displayMode === "limited" &&
        onSeeAllConventionsClick && (
          <Button
            onClick={onSeeAllConventionsClick}
            priority="secondary"
            className={fr.cx("fr-mb-2w")}
          >
            Voir tout ({pagination.totalRecords})
          </Button>
        )}
      {conventionsDisplayed.map((convention) => (
        <AgencyTaskItem key={convention.id} convention={convention} />
      ))}
      {displayMode === "paginated" && (
        <Pagination
          count={pagination?.totalPages ?? 1}
          defaultPage={pagination?.currentPage ?? 1}
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
      {convention.signatories.beneficiary.firstName}{" "}
      {convention.signatories.beneficiary.lastName}{" "}
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
  const immersionStartedSinceDays = differenceInCalendarDays(
    convertLocaleDateToUtcTimezoneDate(new Date()),
    convertLocaleDateToUtcTimezoneDate(new Date(convention.dateStart)),
  );
  const immersionStartsInDays = Math.abs(immersionStartedSinceDays);

  const description = match({ immersionStartedSinceDays })
    .with({ immersionStartedSinceDays: P.when((days) => days > 1) }, () => (
      <>
        ⚠️ L'immersion a déjà commencé depuis{" "}
        <strong>{immersionStartedSinceDays} jours</strong>
      </>
    ))
    .with(
      { immersionStartedSinceDays: P.when((days) => days === 1 || days === 0) },
      () => (
        <>
          ⚠️ L'immersion a commencé{" "}
          <strong>
            {immersionStartedSinceDays === 1 ? "hier" : "aujourd'hui"}
          </strong>
        </>
      ),
    )
    .with({ immersionStartedSinceDays: P.when((days) => days === -1) }, () => (
      <>
        <Badge className={fr.cx("fr-badge--error")}>J-1</Badge> L'immersion
        commence <strong>demain</strong>
      </>
    ))
    .with({ immersionStartedSinceDays: P.when((days) => days < -1) }, () => (
      <>
        <Badge className={fr.cx("fr-badge--error")}>
          J-{immersionStartsInDays}
        </Badge>{" "}
        L'immersion commence <strong>dans {immersionStartsInDays} jours</strong>
      </>
    ))
    .run();

  return (
    <Task
      title={title}
      titleAs="h4"
      description={description}
      footer={footer}
      buttonProps={{
        children: "Traiter",
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
