import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Tile from "@codegouvfr/react-dsfr/Tile";
import { addDays, differenceInCalendarDays, subMonths } from "date-fns";
import { useEffect } from "react";
import { HeadingSection } from "react-design-system";
import { useDispatch } from "react-redux";
import { type ConventionDto, convertLocaleDateToUtcTimezoneDate } from "shared";
import { labelAndSeverityByStatus } from "src/app/contents/convention/labelAndSeverityByStatus";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserConventionsSelectors } from "src/core-logic/domain/connected-user/conventions/connectedUserConventions.selectors";
import { connectedUserConventionsSlice } from "src/core-logic/domain/connected-user/conventions/connectedUserConventions.slice";
import { match, P } from "ts-pattern";

const NUMBER_ITEM_TO_DISPLAY_IN_LIMITED_MODE = 3;

export const AgencyToDoList = ({
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

  useEffect(() => {
    if (connectedUserJwt) {
      const dateStartFrom1MonthAgoToIn5Days = {
        dateStartFrom: subMonths(new Date(), 1).toISOString(),
        dateStartTo: addDays(new Date(), 5).toISOString(),
      };
      dispatch(
        connectedUserConventionsSlice.actions.getConventionsForConnectedUserRequested(
          {
            params: {
              ...dateStartFrom1MonthAgoToIn5Days,
              sortBy: "dateStart",
              sortOrder: "asc",
              page: 1,
              perPage: 10,
            },
            jwt: connectedUserJwt,
            feedbackTopic: "connected-user-conventions",
          },
        ),
      );
    }
  }, [dispatch, connectedUserJwt]);

  return (
    <HeadingSection
      title="Tâches à traiter"
      titleAs={titleAs}
      className={fr.cx("fr-mt-2w")}
    >
      {currentUserConventions.length === 0 && (
        <p>Aucune convention à traiter en urgence.</p>
      )}
      {currentUserConventions.length > 3 &&
        displayMode === "limited" &&
        onSeeAllConventionsClick && (
          <Button
            onClick={onSeeAllConventionsClick}
            priority="secondary"
            className={fr.cx("fr-mb-2w")}
            iconId="fr-icon-arrow-right-line"
          >
            Voir tout ({currentUserConventions.length} conventions)
          </Button>
        )}
      {currentUserConventions
        .slice(
          0,
          displayMode === "limited"
            ? NUMBER_ITEM_TO_DISPLAY_IN_LIMITED_MODE
            : currentUserConventions.length,
        )
        .map((convention) => (
          <AgencyToDoItem key={convention.id} convention={convention} />
        ))}
    </HeadingSection>
  );
};

const AgencyToDoItem = ({ convention }: { convention: ConventionDto }) => {
  const title = (
    <>
      {convention.signatories.beneficiary.firstName}{" "}
      {convention.signatories.beneficiary.lastName}{" "}
      <Badge className={labelAndSeverityByStatus[convention.status].color}>
        {labelAndSeverityByStatus[convention.status].label}
      </Badge>
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
        <Badge className={fr.cx("fr-badge--error")}>J-1</Badge> Dans 1 jour
      </>
    ))
    .with({ immersionStartedSinceDays: P.when((days) => days < -1) }, () => (
      <>
        <Badge className={fr.cx("fr-badge--error")}>
          J-{immersionStartsInDays}
        </Badge>{" "}
        Dans {immersionStartsInDays} jours
      </>
    ))
    .run();

  return (
    <Tile
      className={fr.cx("fr-mb-2w", "fr-p-2w")}
      title={title}
      titleAs="h4"
      orientation="horizontal"
      desc={description}
      linkProps={{
        href: routes.manageConventionConnectedUser({
          conventionId: convention.id,
        }).link.href,
      }}
    />
  );
};
