import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import { Checkbox, type CheckboxProps } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import RadioButtons, {
  type RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import { equals, pick } from "ramda";
import { Fragment, useEffect, useMemo, useState } from "react";
import { HeadingSection, RichTable } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type ConventionStatus,
  conventionStatuses,
  defaultPerPageInWebPagination,
  domElementIds,
  type FlatGetConventionsForAgencyUserParams,
  getFormattedFirstnameAndLastname,
  isNotEmptyArray,
  toDisplayedDate,
} from "shared";
import { WithFeedbackReplacer } from "src/app/components/feedback/WithFeedbackReplacer";
import { MetabaseFullScreenButton } from "src/app/components/MetabaseFullScreenButton";
import { labelAndSeverityByStatus } from "src/app/contents/convention/labelAndSeverityByStatus";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { conventionListSelectors } from "src/core-logic/domain/connected-user/conventionList/connectedUserConventionList.selectors";
import {
  conventionListSlice,
  initialConventionWithPagination,
} from "src/core-logic/domain/connected-user/conventionList/connectedUserConventionList.slice";
import { match, P } from "ts-pattern";
import { useStyles } from "tss-react/dsfr";

type DateFilterType = keyof Pick<
  FlatGetConventionsForAgencyUserParams,
  "dateStartFrom" | "dateStartTo" | "dateEndFrom" | "dateEndTo"
>;

type DateFilterState = {
  type: DateFilterType;
  value: string;
};

type DateFilterStates = {
  dateStart: DateFilterState;
  dateEnd: DateFilterState;
};

export const ConventionList = () => {
  const dispatch = useDispatch();
  const { cx } = useStyles();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);
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
        [
          "statuses",
          "dateStartFrom",
          "dateStartTo",
          "dateEndFrom",
          "dateEndTo",
        ],
        initialConventionWithPagination.filters,
      ),
    [],
  );
  const [tempFilters, setTempFilters] =
    useState<
      Pick<
        FlatGetConventionsForAgencyUserParams,
        | "statuses"
        | "dateStartFrom"
        | "dateStartTo"
        | "dateEndFrom"
        | "dateEndTo"
      >
    >(defaultFilters);

  const [dateFilterStates, setDateFilterStates] = useState<DateFilterStates>({
    dateStart: {
      type: "dateStartFrom",
      value: "",
    },
    dateEnd: {
      type: "dateEndFrom",
      value: "",
    },
  });

  const statusOptions: CheckboxProps["options"] = useMemo(() => {
    return conventionStatuses.map((status) => ({
      label: labelAndSeverityByStatus[status].label,
      nativeInputProps: {
        value: status,
        onChange: (event) => {
          const existingStatuses = tempFilters.statuses ?? [];
          const newStatuses =
            event.currentTarget.checked &&
            isStringConventionStatus(event.currentTarget.value)
              ? [...existingStatuses, event.currentTarget.value]
              : existingStatuses.filter(
                  (status) => status !== event.currentTarget.value,
                );

          setTempFilters({
            ...tempFilters,
            statuses: isNotEmptyArray(newStatuses) ? newStatuses : undefined,
          });
        },
      },
    }));
  }, [tempFilters]);

  const startDateOptions: RadioButtonsProps["options"] = useMemo(
    () =>
      createDateOptions(
        "dateStart",
        dateFilterStates.dateStart,
        tempFilters,
        setDateFilterStates,
      ),
    [dateFilterStates.dateStart, tempFilters],
  );

  const endDateOptions: RadioButtonsProps["options"] = useMemo(
    () =>
      createDateOptions(
        "dateEnd",
        dateFilterStates.dateEnd,
        tempFilters,
        setDateFilterStates,
      ),
    [dateFilterStates.dateEnd, tempFilters],
  );

  const onSubmit = (filtersToUse = tempFilters, searchQuery?: string) => {
    if (!connectedUserJwt) return;

    dispatch(
      conventionListSlice.actions.fetchConventionListRequested({
        jwt: connectedUserJwt,
        filters: {
          ...filters,
          ...filtersToUse,
          ...(searchQuery && { search: searchQuery }),
          page: 1,
          perPage: defaultPerPageInWebPagination,
        },
        feedbackTopic: "connected-user-conventionList",
      }),
    );
  };

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
        "Personne en immersion",
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
    <HeadingSection
      title="Conventions"
      titleAs="h3"
      className={fr.cx("fr-mt-0")}
      titleAction={
        currentUser?.dashboards.agencies.agencyDashboardUrl ? (
          <MetabaseFullScreenButton
            url={currentUser.dashboards.agencies.agencyDashboardUrl}
            label="Voir l'ancien tableau"
          />
        ) : null
      }
    >
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
              isLoading={isLoading}
              data={conventions.map((convention) => [
                <Fragment key={convention.id}>
                  <strong>
                    {getFormattedFirstnameAndLastname({
                      firstname: convention.agencyReferent?.firstname,
                      lastname: convention.agencyReferent?.lastname,
                    }) || "Non communiqué"}
                  </strong>{" "}
                  <Tooltip kind="hover" title={convention.agencyName} />
                </Fragment>,
                <Fragment key={convention.id}>
                  <Badge
                    className={cx(
                      labelAndSeverityByStatus[convention.status].color,
                    )}
                    small
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
                    values:
                      filters.statuses?.length &&
                      filters.statuses?.length !== conventionStatuses.length
                        ? [
                            `${filters.statuses.length > 1 ? "Statuts" : "Statut :"}  ${
                              filters.statuses.length > 1
                                ? `(${filters.statuses.length})`
                                : filters.statuses
                                    .map(
                                      (status) =>
                                        labelAndSeverityByStatus[status].label,
                                    )
                                    .join(", ")
                            }`,
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
                    id: "dateStart",
                    iconId: "fr-icon-calendar-line" as const,
                    defaultValue: "Date de début",
                    values: [
                      (() => {
                        if (filters.dateStartFrom) {
                          return `Démarrant après le ${filters.dateStartFrom}`;
                        }
                        if (filters.dateStartTo) {
                          return `Démarrant avant le ${filters.dateStartTo}`;
                        }
                        return "Date de début";
                      })(),
                    ],
                    submenu: {
                      title: "Filtrer par date de début",
                      content: (
                        <>
                          <RadioButtons options={startDateOptions} />
                          <div className={cx("fr-mt-2")}>
                            <Input
                              label="Date"
                              nativeInputProps={{
                                type: "date",
                                value: dateFilterStates.dateStart.value,
                                onChange: (event) => {
                                  setDateFilterStates((prev) => ({
                                    ...prev,
                                    dateStart: {
                                      ...prev.dateStart,
                                      value: event.target.value,
                                    },
                                  }));
                                  const newFilters = {
                                    ...tempFilters,
                                    [dateFilterStates.dateStart.type]:
                                      event.target.value || undefined,
                                    ...(dateFilterStates.dateStart.type ===
                                    "dateStartFrom"
                                      ? { dateStartTo: undefined }
                                      : { dateStartFrom: undefined }),
                                  };
                                  setTempFilters(newFilters);
                                },
                              }}
                            />
                          </div>
                        </>
                      ),
                    },
                    onReset: () => {
                      setDateFilterStates((prev) => ({
                        ...prev,
                        dateStart: {
                          type: "dateStartFrom",
                          value: "",
                        },
                      }));
                      setTempFilters((prev) => ({
                        ...prev,
                        dateStartFrom: undefined,
                        dateStartTo: undefined,
                      }));

                      onSubmit();
                    },
                  },
                  {
                    id: "dateEnd",
                    iconId: "fr-icon-calendar-line" as const,
                    defaultValue: "Date de fin",
                    values: [
                      (() => {
                        if (filters.dateEndFrom) {
                          return `Se terminant après le ${filters.dateEndFrom}`;
                        }
                        if (filters.dateEndTo) {
                          return `Se terminant avant le ${filters.dateEndTo}`;
                        }
                        return "Date de fin";
                      })(),
                    ],
                    submenu: {
                      title: "Filtrer par date de fin",
                      content: (
                        <>
                          <RadioButtons options={endDateOptions} />
                          <div className={cx("fr-mt-2")}>
                            <Input
                              label="Date"
                              nativeInputProps={{
                                type: "date",
                                value: dateFilterStates.dateEnd.value,
                                onChange: (event) => {
                                  setDateFilterStates((prev) => ({
                                    ...prev,
                                    dateEnd: {
                                      ...prev.dateEnd,
                                      value: event.target.value,
                                    },
                                  }));
                                  const newFilters = {
                                    ...tempFilters,
                                    [dateFilterStates.dateEnd.type]:
                                      event.target.value || undefined,
                                    ...(dateFilterStates.dateEnd.type ===
                                    "dateEndFrom"
                                      ? { dateEndTo: undefined }
                                      : { dateEndFrom: undefined }),
                                  };
                                  setTempFilters(newFilters);
                                },
                              }}
                            />
                          </div>
                        </>
                      ),
                    },
                    onReset: () => {
                      setDateFilterStates((prev) => ({
                        ...prev,
                        dateEnd: {
                          type: "dateEndFrom",
                          value: "",
                        },
                      }));
                      setTempFilters((prev) => ({
                        ...prev,
                        dateEndFrom: undefined,
                        dateEndTo: undefined,
                      }));

                      onSubmit();
                    },
                  },
                ],
                onSubmit: () => onSubmit(),
              }}
              searchBar={{
                label: "Rechercher",
                placeholder: "Rechercher",
                onSubmit: (query: string) => {
                  onSubmit(tempFilters, query);
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

const isStringConventionStatus = (value: string): value is ConventionStatus => {
  return conventionStatuses.includes(value as ConventionStatus);
};

const createDateOptions = (
  filterType: "dateStart" | "dateEnd",
  currentState: DateFilterState,
  tempFilters: Pick<
    FlatGetConventionsForAgencyUserParams,
    "dateStartFrom" | "dateStartTo" | "dateEndFrom" | "dateEndTo"
  >,
  setDateFilterStates: React.Dispatch<React.SetStateAction<DateFilterStates>>,
): RadioButtonsProps["options"] => {
  const config: {
    dateStart: {
      labels: { before: string; after: string };
      types: { to: "dateStartTo"; from: "dateStartFrom" };
      values: { to: string | undefined; from: string | undefined };
    };
    dateEnd: {
      labels: { before: string; after: string };
      types: { to: "dateEndTo"; from: "dateEndFrom" };
      values: { to: string | undefined; from: string | undefined };
    };
  } = {
    dateStart: {
      labels: { before: "Démarrant avant le", after: "Démarrant après le" },
      types: { to: "dateStartTo", from: "dateStartFrom" },
      values: { to: tempFilters.dateStartTo, from: tempFilters.dateStartFrom },
    },
    dateEnd: {
      labels: {
        before: "Se terminant avant le",
        after: "Se terminant après le",
      },
      types: { to: "dateEndTo", from: "dateEndFrom" },
      values: { to: tempFilters.dateEndTo, from: tempFilters.dateEndFrom },
    },
  };

  const { labels, types, values } = config[filterType];

  return [
    {
      label: labels.before,
      nativeInputProps: {
        value: types.to,
        defaultChecked: currentState.type === types.to,
        onChange: () => {
          setDateFilterStates((prev) => ({
            ...prev,
            [filterType]: {
              type: types.to,
              value: values.to || "",
            },
          }));
        },
      },
    },
    {
      label: labels.after,
      nativeInputProps: {
        value: types.from,
        defaultChecked: currentState.type === types.from,
        onChange: () => {
          setDateFilterStates((prev) => ({
            ...prev,
            [filterType]: {
              type: types.from,
              value: values.from || "",
            },
          }));
        },
      },
    },
  ];
};
