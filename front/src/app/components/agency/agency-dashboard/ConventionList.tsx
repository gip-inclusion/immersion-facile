import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import { Checkbox, type CheckboxProps } from "@codegouvfr/react-dsfr/Checkbox";
import RadioButtons, {
  type RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import { equals, pick } from "ramda";
import { Fragment, useEffect, useMemo, useState } from "react";
import { RichTable } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type ConventionSortDirection,
  type ConventionStatus,
  conventionStatuses,
  defaultPerPageInWebPagination,
  domElementIds,
  type GetPaginatedConventionsSortBy,
  toDisplayedDate,
} from "shared";
import { WithFeedbackReplacer } from "src/app/components/feedback/WithFeedbackReplacer";
import { labelAndSeverityByStatus } from "src/app/contents/convention/labelAndSeverityByStatus";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionListSelectors } from "src/core-logic/domain/connected-user/conventionList/connectedUserConventionList.selectors";
import {
  conventionListSlice,
  type FlatGetConventionsForAgencyUserParamsWithStatusesAsArray,
  initialConventionWithPagination,
} from "src/core-logic/domain/connected-user/conventionList/connectedUserConventionList.slice";
import { match, P } from "ts-pattern";
import { useStyles } from "tss-react/dsfr";
import { getFormattedFirstnameAndLastname } from "../../../../../../shared/src/utils/string";

export const ConventionList = () => {
  const dispatch = useDispatch();
  const { cx } = useStyles();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const {
    data: conventions,
    pagination,
    filters,
  } = useAppSelector(conventionListSelectors.conventionsWithPagination);
  const hasConventions = conventions.length > 0;
  const filtersAreEmpty = equals(
    filters,
    initialConventionWithPagination.filters,
  );
  const isLoading = useAppSelector(conventionListSelectors.isLoading);

  const defaultFilters = useMemo(
    () =>
      pick(
        ["sortBy", "sortDirection", "statuses"],
        initialConventionWithPagination.filters,
      ),
    [],
  );
  const [tempFilters, setTempFilters] =
    useState<
      Pick<
        FlatGetConventionsForAgencyUserParamsWithStatusesAsArray,
        "statuses" | "sortBy" | "sortDirection"
      >
    >(defaultFilters);

  const statusOptions: CheckboxProps["options"] = useMemo(() => {
    return conventionStatuses.map((status) => ({
      label: labelAndSeverityByStatus[status].label,
      nativeInputProps: {
        value: status,
        onChange: (event) => {
          const existingStatuses = tempFilters.statuses ?? [];
          setTempFilters({
            ...tempFilters,
            statuses:
              event.currentTarget.checked &&
              isStringConventionStatus(event.currentTarget.value)
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
    return dateSortOptions.map((option) => ({
      label: option.label,
      nativeInputProps: {
        value: `${option.sortBy}-${option.sortDirection}`,
        defaultChecked:
          filters.sortBy === option.sortBy &&
          filters.sortDirection === option.sortDirection,
        onChange: () => {
          setTempFilters({
            ...tempFilters,
            sortBy: option.sortBy,
            sortDirection: option.sortDirection,
          });
        },
      },
    }));
  }, [tempFilters, filters]);

  useEffect(() => {
    if (connectedUserJwt) {
      dispatch(
        conventionListSlice.actions.fetchConventionListRequested({
          filters: {
            sortBy: "dateStart",
            sortDirection: "asc",
            page: 1,
            perPage: 10,
          },
          jwt: connectedUserJwt,
          feedbackTopic: "connected-user-conventions",
        }),
      );
    }
  }, [dispatch, connectedUserJwt]);

  if (!connectedUserJwt) {
    return;
  }

  const getTableHeaders = () => {
    if (hasConventions) {
      return [
        "Conseiller",
        "Statut",
        "Bénéficiaire",
        "Établissement",
        "Dates",
        "Actions",
      ];
    }
    if (!filtersAreEmpty) {
      return [
        "Aucune convention trouvée avec ces filtres, vous pouvez modifier les filtres pour élargir votre recherche.",
      ];
    }
    return ["Nous n'avons pas trouvé de convention."];
  };

  return (
    <WithFeedbackReplacer topic="connected-user-conventionList">
      {match({
        conventions,
      })

        .with({ conventions: P.nullish }, () => (
          <p>Nous n'avons pas trouvé de conventions</p>
        ))
        .with({ conventions: P.not(P.nullish) }, () => (
          <RichTable
            headers={getTableHeaders()}
            className={fr.cx("fr-mt-4w")}
            isLoading={isLoading}
            data={conventions.map((convention) => [
              <Fragment key={convention.id}>
                <strong>
                  {getFormattedFirstnameAndLastname({
                    firstname: convention.agencyReferent?.firstname,
                    lastname: convention.agencyReferent?.lastname,
                  })}
                </strong>
                <Tooltip kind="hover" title={convention.agencyName} />
              </Fragment>,
              <Fragment key={convention.id}>
                <Badge
                  className={cx(
                    labelAndSeverityByStatus[convention.status].color,
                  )}
                >
                  {labelAndSeverityByStatus[convention.status].label}
                </Badge>
              </Fragment>,
              <Fragment key={convention.id}>
                <strong>
                  {getFormattedFirstnameAndLastname({
                    firstname: convention.signatories.beneficiary.firstName,
                    lastname: convention.signatories.beneficiary.lastName,
                  })}
                </strong>
              </Fragment>,
              <Fragment key={convention.id}>
                <strong>{convention.businessName}</strong>
              </Fragment>,
              <Fragment key={convention.id}>
                Du{" "}
                {toDisplayedDate({
                  date: new Date(convention.dateStart),
                  withHours: false,
                })}
                <br />
                Au{" "}
                {toDisplayedDate({
                  date: new Date(convention.dateEnd),
                  withHours: false,
                })}
              </Fragment>,
              <Button
                key={convention.id}
                id={`${domElementIds.agencyDashboard.dashboard.goToConventionButton}--${convention.id}`}
                size="small"
                iconId="fr-icon-external-link-line"
                iconPosition="right"
                priority="secondary"
                linkProps={{
                  ...routes.manageConventionConnectedUser({
                    conventionId: convention.id,
                  }).link,
                }}
              >
                Piloter
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
                          .map(
                            (status) => labelAndSeverityByStatus[status].label,
                          )
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
                  defaultValue: "Date de début décroissante",
                  values: [
                    (() => {
                      const currentOption = dateSortOptions.find(
                        (option) =>
                          option.sortBy === (filters.sortBy ?? "dateStart") &&
                          option.sortDirection ===
                            (filters.sortDirection ?? "desc"),
                      );
                      return (
                        currentOption?.label ?? "Date de début décroissante"
                      );
                    })(),
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
                  conventionListSlice.actions.fetchConventionListRequested({
                    jwt: connectedUserJwt,
                    filters: {
                      ...filters,
                      ...tempFilters,
                      page: 1,
                      perPage: defaultPerPageInWebPagination,
                    },
                    feedbackTopic: "connected-user-conventionList",
                  }),
                );
              },
            }}
            searchBar={{
              label: "Rechercher",
              placeholder: "Rechercher",
              onSubmit: (query: string) => {
                dispatch(
                  conventionListSlice.actions.fetchConventionListRequested({
                    jwt: connectedUserJwt,
                    filters: {
                      ...filters,
                      beneficiaryNameContains: query,
                      establishmentNameContains: query,
                      actorEmailContains: query,
                      page: 1,
                    },
                    feedbackTopic: "connected-user-conventionList",
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
                    conventionListSlice.actions.fetchConventionListRequested({
                      jwt: connectedUserJwt,
                      filters: { ...filters, page: pageNumber },
                      feedbackTopic: "establishment-dashboard-discussion-list",
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
  );
};

type DateSortOption = {
  sortBy: Extract<GetPaginatedConventionsSortBy, "dateStart" | "dateEnd">;
  sortDirection: ConventionSortDirection;
  label: string;
};

const dateSortOptions: readonly DateSortOption[] = [
  {
    sortBy: "dateStart",
    sortDirection: "desc",
    label: "Date de début décroissante",
  },
  {
    sortBy: "dateStart",
    sortDirection: "asc",
    label: "Date de début croissante",
  },
  {
    sortBy: "dateEnd",
    sortDirection: "desc",
    label: "Date de fin décroissante",
  },
  {
    sortBy: "dateEnd",
    sortDirection: "asc",
    label: "Date de fin croissante",
  },
] as const;

const isStringConventionStatus = (value: string): value is ConventionStatus => {
  return conventionStatuses.includes(value as ConventionStatus);
};
