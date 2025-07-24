import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox, { type CheckboxProps } from "@codegouvfr/react-dsfr/Checkbox";
import RadioButtons, {
  type RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import { equals, pick } from "ramda";
import { Fragment, useEffect, useMemo, useState } from "react";
import { HeadingSection, RichTable } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type DiscussionOrderDirection,
  type DiscussionStatus,
  defaultPerPageInWebPagination,
  discussionStatuses,
  domElementIds,
  getFormattedFirstnameAndLastname,
  toDisplayedDate,
  toDisplayedPhoneNumber,
} from "shared";
import { DiscussionStatusBadge } from "src/app/components/establishment/establishment-dashboard/DiscussionStatusBadge";
import { WithFeedbackReplacer } from "src/app/components/feedback/WithFeedbackReplacer";
import { MetabaseFullScreenButton } from "src/app/components/MetabaseFullScreenButton";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { discussionSelectors } from "src/core-logic/domain/discussion/discussion.selectors";
import {
  discussionSlice,
  type FlatGetPaginatedDiscussionsParamsWithStatusesAsArray,
  initialDiscussionsWithPagination,
} from "src/core-logic/domain/discussion/discussion.slice";
import { match, P } from "ts-pattern";

export const DiscussionList = () => {
  const dispatch = useDispatch();
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const {
    data: discussions,
    pagination,
    filters,
  } = useAppSelector(discussionSelectors.discussionsWithPagination);
  const hasDiscussions = discussions.length > 0;
  const filtersAreEmpty = equals(
    filters,
    initialDiscussionsWithPagination.filters,
  );
  const isLoading = useAppSelector(discussionSelectors.isLoading);
  const defaultFilters = useMemo(
    () =>
      pick(
        ["orderBy", "orderDirection", "statuses", "search"],
        initialDiscussionsWithPagination.filters,
      ),
    [],
  );
  const [tempFilters, setTempFilters] =
    useState<
      Pick<
        FlatGetPaginatedDiscussionsParamsWithStatusesAsArray,
        "statuses" | "orderBy" | "orderDirection" | "search"
      >
    >(defaultFilters);

  const statusOptions: CheckboxProps["options"] = useMemo(() => {
    return discussionStatuses.map((status) => ({
      label: displayedStatuses[status],
      nativeInputProps: {
        value: status,
        onChange: (event) => {
          const existingStatuses = tempFilters.statuses ?? [];
          setTempFilters({
            ...tempFilters,
            statuses:
              event.currentTarget.checked &&
              isStringDiscussionStatus(event.currentTarget.value)
                ? [...existingStatuses, event.currentTarget.value]
                : existingStatuses.filter(
                    (status) => status !== event.currentTarget.value,
                  ),
          });
        },
      },
    }));
  }, [tempFilters]);

  const dateOptions: RadioButtonsProps["options"] = useMemo(() => {
    return Object.entries(displayedOrderDirections).map(
      ([orderDirection, label]) => ({
        label,
        nativeInputProps: {
          value: orderDirection,
          defaultChecked: orderDirection === filters.orderDirection,
          onChange: () => {
            setTempFilters({
              ...tempFilters,
              orderDirection: orderDirection as DiscussionOrderDirection,
            });
          },
        },
      }),
    );
  }, [tempFilters, filters]);
  useEffect(() => {
    if (connectedUserJwt) {
      dispatch(
        discussionSlice.actions.fetchDiscussionListRequested({
          jwt: connectedUserJwt,
          filters: initialDiscussionsWithPagination.filters,
          feedbackTopic: "establishment-dashboard-discussion-list",
        }),
      );
    }
  }, [connectedUserJwt, dispatch]);
  if (!connectedUserJwt) {
    return;
  }
  const getTableHeaders = () => {
    if (hasDiscussions) {
      return [
        "Offre d'immersion",
        "Candidat",
        "But de l'immersion",
        "Date",
        "Statut",
        "Actions",
      ];
    }
    if (!filtersAreEmpty) {
      return [
        "Aucune candidature trouvée avec ces filtres, vous pouvez modifier les filtres pour élargir votre recherche.",
      ];
    }
    return [
      "Nous n'avons pas trouvé de candidatures où vous êtes référencés en tant que contact d'entreprise.",
    ];
  };
  return (
    <HeadingSection
      title="Candidatures"
      titleAs="h2"
      className={fr.cx("fr-mt-0")}
      titleAction={
        currentUser?.dashboards.establishments.discussions ? (
          <MetabaseFullScreenButton
            url={currentUser.dashboards.establishments.discussions}
            label="Voir l'ancien tableau"
          />
        ) : null
      }
    >
      <WithFeedbackReplacer topic="establishment-dashboard-discussion-list">
        {match({
          discussions,
        })

          .with({ discussions: P.nullish }, () => (
            <p>
              Nous n'avons pas trouvé de candidatures où vous êtes référencés en
              tant que contact d'entreprise.
            </p>
          ))
          .with({ discussions: P.not(P.nullish) }, () => (
            <RichTable
              headers={getTableHeaders()}
              className={fr.cx("fr-mt-4w")}
              isLoading={isLoading}
              data={discussions.map((discussion) => [
                <Fragment key={discussion.id}>
                  <strong>{discussion.appellation.appellationLabel}</strong>
                  <br />
                  {discussion.businessName}
                </Fragment>,
                <Fragment key={discussion.id}>
                  <strong>
                    {getFormattedFirstnameAndLastname({
                      firstname: discussion.potentialBeneficiary.firstName,
                      lastname: discussion.potentialBeneficiary.lastName,
                    })}
                  </strong>
                  <br />
                  {discussion.potentialBeneficiary.phone
                    ? toDisplayedPhoneNumber(
                        discussion.potentialBeneficiary.phone,
                      )
                    : "Non renseigné"}
                </Fragment>,
                discussion.immersionObjective,
                toDisplayedDate({
                  date: new Date(discussion.createdAt),
                  withHours: false,
                }),
                <DiscussionStatusBadge
                  key={discussion.id}
                  discussion={discussion}
                  small
                />,
                <Button
                  key={discussion.id}
                  id={`${domElementIds.establishmentDashboard.manageDiscussion.goToDiscussionButton}--${discussion.id}`}
                  size="small"
                  priority="secondary"
                  linkProps={{
                    ...routes.establishmentDashboardDiscussions({
                      discussionId: discussion.id,
                    }).link,
                  }}
                >
                  Voir la candidature
                </Button>,
              ])}
              dropdownFilters={{
                items: [
                  {
                    id: "status",
                    iconId: "fr-icon-equalizer-line" as const,
                    defaultValue: "Tous les statuts",
                    values: filters.statuses?.length
                      ? [
                          `Statut : ${filters.statuses
                            .map((status) => displayedStatuses[status])
                            .join(", ")}`,
                        ]
                      : ["Tous les statuts"],
                    submenu: {
                      title: "Filtrer par statut",
                      content: (
                        <>
                          <Checkbox options={statusOptions} />
                        </>
                      ),
                    },
                  },
                  {
                    id: "date",
                    iconId: "fr-icon-arrow-down-line" as const,
                    defaultValue: "Du plus récent au plus ancien",
                    values: [
                      displayedOrderDirections[
                        filters.orderDirection ?? "desc"
                      ],
                    ],
                    submenu: {
                      title: "Trier par date",
                      content: (
                        <>
                          <RadioButtons options={dateOptions} />
                        </>
                      ),
                    },
                  },
                ],
                onSubmit: () => {
                  dispatch(
                    discussionSlice.actions.fetchDiscussionListRequested({
                      jwt: connectedUserJwt,
                      filters: {
                        ...filters,
                        ...tempFilters,
                        page: 1,
                        perPage: defaultPerPageInWebPagination,
                      },
                      feedbackTopic: "establishment-dashboard-discussion-list",
                    }),
                  );
                },
              }}
              searchBar={{
                label: "Rechercher",
                placeholder: "Rechercher",
                onSubmit: (query: string) => {
                  dispatch(
                    discussionSlice.actions.fetchDiscussionListRequested({
                      jwt: connectedUserJwt,
                      filters: {
                        ...filters,
                        search: query,
                        page: 1,
                      },
                      feedbackTopic: "establishment-dashboard-discussion-list",
                    }),
                  );
                },
              }}
              pagination={{
                count: pagination.totalPages,
                defaultPage: pagination.currentPage,
                showFirstLast: true,
                getPageLinkProps: (pageNumber) => ({
                  title: `Résultats de recherche, page : ${pageNumber}`,
                  onClick: (event) => {
                    event.preventDefault();
                    dispatch(
                      discussionSlice.actions.fetchDiscussionListRequested({
                        jwt: connectedUserJwt,
                        filters: { ...filters, page: pageNumber },
                        feedbackTopic:
                          "establishment-dashboard-discussion-list",
                      }),
                    );
                  },
                  href: "#",
                  key: `pagination-link-${pageNumber}`,
                }),
              }}
            />
          ))
          .exhaustive()}
      </WithFeedbackReplacer>
    </HeadingSection>
  );
};

const displayedStatuses: Record<DiscussionStatus, string> = {
  ACCEPTED: "Acceptée",
  REJECTED: "Rejetée",
  PENDING: "En cours",
};

const displayedOrderDirections: Record<DiscussionOrderDirection, string> = {
  desc: "Du plus récent au plus ancien",
  asc: "Du plus ancien au plus récent",
};

const isStringDiscussionStatus = (value: string): value is DiscussionStatus => {
  return discussionStatuses.includes(value as DiscussionStatus);
};
