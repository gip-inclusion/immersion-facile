import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import { useCallback } from "react";
import { HeadingSection, Task } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  getFormattedFirstnameAndLastname,
  NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_PAGE,
} from "shared";
import {
  broadcastFeedbackErrorMap,
  isManagedBroadcastFeedbackError,
} from "src/app/contents/broadcast-feedback/broadcastFeedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionsWithBroadcastFeedbackSelectors } from "src/core-logic/domain/connected-user/conventionsWithBroadcastFeedback/conventionsWithBroadcastFeedback.selectors";
import { conventionsWithBroadcastFeedbackSlice } from "src/core-logic/domain/connected-user/conventionsWithBroadcastFeedback/conventionsWithBroadcastFeedback.slice";

export const ConventionsWithBroadcastErrorList = ({
  title,
}: {
  title: string;
}) => {
  const dispatch = useDispatch();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const conventionsWithBroadcastFeedback = useAppSelector(
    conventionsWithBroadcastFeedbackSelectors.conventionsWithBroadcastFeedback,
  );
  const pagination = useAppSelector(
    conventionsWithBroadcastFeedbackSelectors.pagination,
  );

  const getDescription = (errorMessage: string) => {
    if (isManagedBroadcastFeedbackError(errorMessage)) {
      return broadcastFeedbackErrorMap[errorMessage].description;
    }
    return "Une erreur technique s'est produite.";
  };

  const getConventionsWithErroredBroadcastFeedbackRequested = useCallback(
    (page: number) => {
      if (connectedUserJwt) {
        dispatch(
          conventionsWithBroadcastFeedbackSlice.actions.getConventionsWithErroredBroadcastFeedbackRequested(
            {
              params: {
                page,
                perPage: NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_PAGE,
              },
              jwt: connectedUserJwt,
              feedbackTopic: "conventions-with-broadcast-feedback",
            },
          ),
        );
      }
    },
    [connectedUserJwt, dispatch],
  );

  const onPaginationClick = useCallback(
    (pageNumber: number) => {
      getConventionsWithErroredBroadcastFeedbackRequested(pageNumber);
    },
    [getConventionsWithErroredBroadcastFeedbackRequested],
  );

  return (
    <HeadingSection
      title={title}
      titleAs="h2"
      className={fr.cx("fr-mt-2w", "fr-mb-4w")}
    >
      {conventionsWithBroadcastFeedback?.length === 0 && (
        <p>Aucune convention à traiter en erreur de diffusion.</p>
      )}
      {conventionsWithBroadcastFeedback.map(
        (conventionWithBroadcastFeedback) => (
          <Task
            key={conventionWithBroadcastFeedback.id}
            titleAs="h3"
            title={
              <>
                <span className={fr.cx("fr-pr-2v")}>
                  {getFormattedFirstnameAndLastname({
                    firstname:
                      conventionWithBroadcastFeedback.beneficiary.firstname,
                    lastname:
                      conventionWithBroadcastFeedback.beneficiary.lastname,
                  })}
                </span>
                <Badge className={fr.cx("fr-badge--error")}>
                  ❌ Erreur de synchronisation
                </Badge>
              </>
            }
            description={getDescription(
              conventionWithBroadcastFeedback.lastBroadcastFeedback
                ?.subscriberErrorFeedback?.message ?? "",
            )}
            buttonProps={{
              children: "Piloter",
              priority: "secondary",
              size: "medium",
              linkProps: {
                target: "_blank",
                rel: "noreferrer",
                href: routes.manageConventionConnectedUser({
                  conventionId: conventionWithBroadcastFeedback.id,
                }).link.href,
              },
            }}
          />
        ),
      )}
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
