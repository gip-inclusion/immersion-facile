import { colors, fr } from "@codegouvfr/react-dsfr";
import Accordion, {
  type AccordionProps,
} from "@codegouvfr/react-dsfr/Accordion";
import { Button, type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { Select, type SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { equals, includes, keys } from "ramda";
import {
  type ElementRef,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Loader,
  MainWrapper,
  PageHeader,
  RichDropdown,
  SectionAccordion,
  SectionHighlight,
  SectionTextEmbed,
  useLayout,
  useScrollTo,
} from "react-design-system";
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  domElementIds,
  type FitForDisableWorkerOption,
  fitForDisabledWorkersPositiveOptions,
  type LatLonDistance,
  type NafSectionSuggestion,
  type RemoteWorkMode,
  remoteWorkModeLabels,
  remoteWorkModes,
  type SearchSortedBy,
  searchSortedByOptions,
  type ValueOf,
} from "shared";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { AppellationAutocomplete } from "src/app/components/forms/autocomplete/AppellationAutocomplete";
import { PlaceAutocomplete } from "src/app/components/forms/autocomplete/PlaceAutocomplete";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { SearchInfoSection } from "src/app/components/search/SearchInfoSection";
import { SearchListResults } from "src/app/components/search/SearchListResults";
import { useGetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  encodedSearchUriParams,
  type SearchRoute,
  useSearch,
} from "src/app/hooks/search.hooks";
import labonneboiteLogoUrl from "src/assets/img/logo-lbb-centered.png";
import { featureFlagSelectors } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { geosearchSlice } from "src/core-logic/domain/geosearch/geosearch.slice";
import { nafSelectors } from "src/core-logic/domain/naf/naf.selectors";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import type { SearchPageParams } from "src/core-logic/domain/search/search.slice";
import { useStyles } from "tss-react/dsfr";
import "./SearchPage.scss";
import { nafSlice } from "src/core-logic/domain/naf/naf.slice";
import Styles from "./SearchPage.styles";

const radiusOptions = ["1", "2", "5", "10", "20", "50", "100"].map(
  (distance) => ({
    label: `${distance} km`,
    value: distance,
  }),
);
const DEFAULT_DISTANCE_KM = 10;

const getSearchRouteParam = (
  currentKey: keyof SearchPageParams,
  routeParam: ValueOf<SearchPageParams>,
  defaultValue: unknown,
) => {
  if (!routeParam) {
    return defaultValue;
  }
  return includes(currentKey, encodedSearchUriParams)
    ? decodeURIComponent(`${routeParam}`)
    : routeParam;
};

const parisLatLon = {
  latitude: 48.8566,
  longitude: 2.3522,
};
const parisDistanceKm = 10;
const defaultValuesForExternalSearch: Required<
  Pick<
    SearchPageParams,
    "latitude" | "longitude" | "distanceKm" | "place" | "appellations"
  >
> = {
  latitude: parisLatLon.latitude,
  longitude: parisLatLon.longitude,
  distanceKm: parisDistanceKm,
  place: "Paris, France",
  appellations: [
    {
      romeCode: "J1501",
      appellationCode: "10891",
      romeLabel: "Aide-soignant / Aide-soignante",
      appellationLabel: "Aide-soignant / Aide-soignante",
    },
  ],
};

const appellationHintText = (useNaturalLanguageForAppellations?: boolean) =>
  useNaturalLanguageForAppellations
    ? "Un métier, un domaine ou une activité qui vous intéresse"
    : "Un métier qui vous intéresse";

const appellationPlaceholder = (useNaturalLanguageForAppellations?: boolean) =>
  useNaturalLanguageForAppellations
    ? "Boulanger, comptabilité, travailler avec des enfants..."
    : "Ex : Boulanger, styliste, etc";

const radiusHintText = "Affinez votre localisation";

const placeHintText = "Une ville, un département, une région, etc.";

const placeInputLabel = <>Dans quelle ville ?</>;

export const SearchPage = ({
  route,
  useNaturalLanguageForAppellations,
  isExternal,
}: {
  route: SearchRoute;
  useNaturalLanguageForAppellations?: boolean;
  isExternal: boolean;
}) => {
  const { cx } = useStyles();
  const dispatch = useDispatch();
  const { pagination } = useAppSelector(
    searchSelectors.searchResultsWithPagination,
  );
  const isLoading = useAppSelector(searchSelectors.isLoading);
  const { triggerSearch } = useSearch(route);
  const [searchMade, setSearchMade] = useState<SearchPageParams | null>(null);
  const searchResultsWrapper = useRef<ElementRef<"div">>(null);
  const innerSearchResultWrapper = useRef<ElementRef<"div">>(null);
  const acquisitionParams = useGetAcquisitionParams();
  const { enableSearchByScore } = useAppSelector(
    featureFlagSelectors.featureFlagState,
  );
  const [isPanelOpened, setIsPanelOpened] = useState(false);
  const initialValues: SearchPageParams = {
    sortBy: enableSearchByScore ? "score" : "date",
    sortOrder: "desc",
    distanceKm: isExternal
      ? defaultValuesForExternalSearch.distanceKm
      : undefined,
    latitude: isExternal ? defaultValuesForExternalSearch.latitude : undefined,
    longitude: isExternal
      ? defaultValuesForExternalSearch.longitude
      : undefined,
    fitForDisabledWorkers: undefined,
    nafCodes: undefined,
    nafLabel: undefined,
    appellations: isExternal
      ? defaultValuesForExternalSearch.appellations
      : undefined,
    place: isExternal ? defaultValuesForExternalSearch.place : undefined,
    appellationCodes: isExternal
      ? defaultValuesForExternalSearch.appellations.map(
          (appellation) => appellation.appellationCode,
        )
      : undefined,
    remoteWorkModes: undefined,
    showOnlyAvailableOffers: true,
    ...acquisitionParams,
  };

  const [tempValue, setTempValue] = useState<SearchPageParams>(initialValues);
  const filterFormValues = useCallback((values: SearchPageParams) => {
    return keys(values).reduce((acc, key) => {
      const shouldKeepValue =
        key in values &&
        typeof values[key] !== "undefined" &&
        values[key] !== "";
      return {
        ...acc,
        ...(shouldKeepValue ? { [key]: values[key] } : {}),
      };
    }, {} as SearchPageParams);
  }, []);
  const routeParams = route.params as Partial<SearchPageParams>;
  const methods = useForm<SearchPageParams>({
    defaultValues: keys(initialValues).reduce(
      (acc, currentKey) => ({
        ...acc,
        [currentKey]: getSearchRouteParam(
          currentKey,
          routeParams[currentKey],
          initialValues[currentKey],
        ),
      }),
      {},
    ),
    mode: "onTouched",
  });
  const { handleSubmit, setValue, register, control, getValues } = methods;
  const formValues = getValues();
  const [lat, lon, distanceKm, place] = useWatch({
    control,
    name: ["latitude", "longitude", "distanceKm", "place"],
  });

  const searchHasBeenMade = searchMade !== null;

  const nafOptions = useAppSelector(nafSelectors.allSections);

  const internalSearchIsAvailableForInitialSearchRequest =
    !isExternal &&
    !searchHasBeenMade &&
    keys(routeParams).length &&
    lat !== 0 &&
    lon !== 0;

  const externalSearchIsAvailableForInitialSearchRequest =
    isExternal &&
    !searchHasBeenMade &&
    keys(routeParams).length &&
    lat !== 0 &&
    lon !== 0 &&
    distanceKm !== 0;
  routeParams.appellationCodes && routeParams.appellationCodes.length > 0;

  const filteredSortOptions = getSortedByOptions(
    areValidGeoParams(formValues),
    enableSearchByScore.isActive,
  );

  const appellationInputLabel = (
    <>
      {useNaturalLanguageForAppellations
        ? "Que souhaitez-vous faire ou découvrir ?"
        : "Je recherche le métier..."}
    </>
  );

  const setTempValuesAsFormValues = useCallback(
    (values: Partial<SearchPageParams>) => {
      keys(values).forEach((key) => {
        setValue(key, values[key]);
      });
    },
    [setValue],
  );

  const onSearchFormSubmit = useCallback(
    (updatedValues: SearchPageParams) => {
      setTempValue(updatedValues);
      setTempValuesAsFormValues(updatedValues);
      setSearchMade(updatedValues);
      triggerSearch(filterFormValues(updatedValues), isExternal);
    },
    [setTempValuesAsFormValues, triggerSearch, filterFormValues, isExternal],
  );

  useScrollTo(pagination?.currentPage ?? 1);

  useEffect(() => {
    if (
      internalSearchIsAvailableForInitialSearchRequest ||
      externalSearchIsAvailableForInitialSearchRequest
    ) {
      onSearchFormSubmit(filterFormValues(formValues));
    }
  }, [
    internalSearchIsAvailableForInitialSearchRequest,
    externalSearchIsAvailableForInitialSearchRequest,
    onSearchFormSubmit,
    filterFormValues,
    formValues,
  ]);

  useEffect(() => {
    return () => {
      setSearchMade(null);
      dispatch(
        geosearchSlice.actions.emptyQueryRequested({
          locator: "search-form-place",
        }),
      );
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(nafSlice.actions.getAllSectionsRequested());
  }, [dispatch]);

  const displayTotalFiltersLength = (formValues: SearchPageParams): string => {
    const currentFiltersLength = [
      ...getAppellationAndNafValues(
        formValues.appellationCodes,
        formValues.nafCodes,
      ),
      ...getEstablishmentAdditionalValues(
        formValues.fitForDisabledWorkers,
        formValues.showOnlyAvailableOffers,
      ),
      ...getLocalisationValues(formValues.place, formValues.remoteWorkModes),
    ].length;
    return currentFiltersLength > 0 ? `(${currentFiltersLength})` : "";
  };

  return (
    <HeaderFooterLayout>
      <MainWrapper vSpacing={0} layout="fullscreen">
        {!searchHasBeenMade ? (
          <>
            <PageHeader
              title={
                route.name === "search"
                  ? "Trouver une immersion"
                  : "Trouver un stage"
              }
              breadcrumbs={<Breadcrumbs />}
            >
              <p>Dans une entreprise ou une administration publique</p>
              <form
                onSubmit={handleSubmit((value) =>
                  onSearchFormSubmit(filterFormValues(value)),
                )}
                className={cx(
                  fr.cx("fr-grid-row", "fr-grid-row--gutters"),
                  Styles.form,
                  Styles.formV2,
                )}
                id={domElementIds[route.name].searchForm}
              >
                <div className={cx(fr.cx("fr-col-12", "fr-col-lg-4"))}>
                  <AppellationAutocomplete
                    locator="search-form-appellation"
                    label={appellationInputLabel}
                    hintText={appellationHintText(
                      useNaturalLanguageForAppellations,
                    )}
                    onAppellationSelected={(appellationMatch) => {
                      setValue("appellations", [appellationMatch.appellation]);
                      setValue("appellationCodes", [
                        appellationMatch.appellation.appellationCode,
                      ]);
                    }}
                    onAppellationClear={() => {
                      setValue("appellations", undefined);
                      setValue("appellationCodes", undefined);
                    }}
                    selectProps={{
                      inputId:
                        domElementIds[route.name].appellationAutocomplete,
                      placeholder: appellationPlaceholder(
                        useNaturalLanguageForAppellations,
                      ),
                    }}
                  />
                </div>
                <div className={cx(fr.cx("fr-col-12", "fr-col-lg-4"))}>
                  <PlaceAutocomplete
                    locator="search-form-place"
                    label={placeInputLabel}
                    initialInputValue={place}
                    hintText="Une ville, un département, une région, etc."
                    onPlaceSelected={(lookupSearchResult) => {
                      if (!lookupSearchResult) return;
                      setValue("latitude", lookupSearchResult.position.lat);
                      setValue("longitude", lookupSearchResult.position.lon);
                      setValue("place", lookupSearchResult.label);
                      if (!formValues.distanceKm) {
                        setValue("distanceKm", DEFAULT_DISTANCE_KM);
                      }
                    }}
                    selectProps={{
                      inputId: domElementIds[route.name].placeAutocompleteInput,
                    }}
                    onPlaceClear={() => {
                      setValue("latitude", initialValues.latitude);
                      setValue("longitude", initialValues.latitude);
                      setValue("place", initialValues.place);
                      if (formValues.sortBy === "distance") {
                        setValue("sortBy", "date");
                      }
                      setValue("distanceKm", initialValues.distanceKm);
                    }}
                  />
                </div>
                <div className={cx(fr.cx("fr-col-12", "fr-col-lg-2"))}>
                  <Select
                    label="Dans un rayon de :"
                    hint={radiusHintText}
                    options={radiusOptions}
                    disabled={!lat || !lon}
                    nativeSelectProps={{
                      title:
                        !lat || !lon
                          ? "Pour sélectionner une distance, vous devez d'abord définir une ville."
                          : undefined,
                      id: domElementIds[route.name].distanceSelect,
                      value: `${distanceKm === undefined ? DEFAULT_DISTANCE_KM : distanceKm}`,
                      onChange: (event) => {
                        const value = Number.parseInt(
                          event.currentTarget.value,
                          10,
                        );
                        setValue("distanceKm", value);
                        if (!value) {
                          setValue("sortBy", "date");
                        }
                      },
                    }}
                  />
                </div>

                <div className={cx(fr.cx("fr-col-12", "fr-col-lg-2"))}>
                  <Button
                    type="submit"
                    nativeButtonProps={{
                      id: domElementIds[route.name].searchSubmitButton,
                    }}
                    disabled={!canSubmitSearch(formValues)}
                  >
                    Rechercher
                  </Button>
                </div>
              </form>
            </PageHeader>

            <div className={fr.cx("fr-pt-6w", "fr-mt-6w", "fr-hr")}>
              <SearchInfoSection />
              <SectionAccordion />
              <SectionTextEmbed
                videoUrl="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise.mp4"
                videoPosterUrl="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_poster.webp"
                videoDescription="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_transcript.vtt"
                videoTranscription="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_transcript.txt"
              />
            </div>
          </>
        ) : (
          <>
            {isLoading && <Loader />}
            <Breadcrumbs />
            {isExternal && (
              <div className={fr.cx("fr-container", "fr-mb-4w")}>
                <SectionHighlight
                  className={fr.cx(
                    "fr-grid-row",
                    "fr-grid-row--gutters",
                    "fr-grid-row--middle",
                  )}
                >
                  <div className={fr.cx("fr-col-12", "fr-col-lg-2")}>
                    <img src={labonneboiteLogoUrl} alt="La Bonne Boite" />
                  </div>
                  <div className={fr.cx("fr-col-12", "fr-col-lg-10")}>
                    <h1 className={fr.cx("fr-h3", "fr-mb-1w")}>
                      Vos résultats La Bonne Boite
                    </h1>
                    <p className={fr.cx("fr-text--md", "fr-mb-0")}>
                      Voici{" "}
                      <strong>
                        {pagination.totalRecords} entreprises à fort potentiel
                        d’embauche
                      </strong>{" "}
                      provenant de{" "}
                      <a
                        href="https://labonneboite.francetravail.fr/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        La Bonne Boite
                      </a>
                      .
                    </p>
                  </div>
                </SectionHighlight>
              </div>
            )}
            <FormProvider {...methods}>
              <form
                onSubmit={handleSubmit((value) => {
                  if (tempValue !== null) {
                    const updatedValues: SearchPageParams = {
                      ...value,
                      ...tempValue,
                    };
                    onSearchFormSubmit(updatedValues);
                  }
                })}
                className={cx(
                  fr.cx("fr-container", "fr-mb-4w"),
                  Styles.searchFilters,
                )}
                id={domElementIds[route.name].searchForm}
              >
                <SearchFilterPanel
                  initialValues={initialValues}
                  tempValue={tempValue}
                  appellationInputLabel={appellationInputLabel}
                  useNaturalLanguageForAppellations={
                    useNaturalLanguageForAppellations
                  }
                  routeName={route.name}
                  isPanelOpened={isPanelOpened}
                  setIsPanelOpened={setIsPanelOpened}
                  appellationHintText={appellationHintText}
                  onSearchFormSubmit={onSearchFormSubmit}
                  setTempValue={setTempValue}
                  nafOptions={nafOptions}
                />
                <section
                  className={cx(
                    fr.cx("fr-grid-row", "fr-grid-row--middle"),
                    Styles.resultsHeader,
                  )}
                >
                  <Button
                    type="button"
                    priority="secondary"
                    iconId="fr-icon-equalizer-line"
                    size="small"
                    onClick={() => setIsPanelOpened(true)}
                  >
                    Filtrer {displayTotalFiltersLength(formValues)}
                  </Button>
                  <div className={fr.cx("fr-hidden", "fr-unhidden-lg")}>
                    <RichDropdown
                      defaultValue="Trier par pertinence"
                      iconId="fr-icon-arrow-down-line"
                      id={domElementIds[route.name].sortFilterTag}
                      values={
                        formValues.sortBy
                          ? [sortedByOptionsLabel[formValues.sortBy]]
                          : []
                      }
                      className={fr.cx("fr-ml-2w")}
                      submenu={{
                        title: "Ordre d’affichage",
                        content: (
                          <RadioButtons
                            id={domElementIds[route.name].sortRadioButtons}
                            options={filteredSortOptions.map((option) => ({
                              ...option,
                              nativeInputProps: {
                                name: register("sortBy").name,
                                value: option.value,
                                disabled: option.disabled,
                                checked: tempValue
                                  ? option.value === tempValue.sortBy
                                  : false,
                                onClick: (event) => {
                                  const updatedSortedBy = isSearchSortedBy(
                                    event.currentTarget.value,
                                  )
                                    ? event.currentTarget.value
                                    : "score";
                                  if (
                                    updatedSortedBy === "distance" &&
                                    areValidGeoParams(tempValue)
                                  ) {
                                    setTempValue({
                                      ...tempValue,
                                      sortBy: "distance",
                                    });
                                  }
                                  if (updatedSortedBy !== "distance") {
                                    setTempValue({
                                      ...tempValue,
                                      sortBy: updatedSortedBy,
                                    });
                                  }
                                },
                              },
                            }))}
                          />
                        ),
                      }}
                    />
                  </div>

                  <div
                    className={cx(fr.cx("fr-ml-auto"), Styles.resultsSummary)}
                  >
                    {!isExternal && (
                      <>
                        <h2 className={fr.cx("fr-h5", "fr-mb-0")}>
                          <strong>{pagination.totalRecords}</strong> résultat
                          {pagination.totalRecords > 1 ? "s" : ""} trouvé
                          {pagination.totalRecords > 1 ? "s" : ""}
                        </h2>
                        {routeParams.appellations &&
                          routeParams.appellations.length > 0 && (
                            <span className={cx(fr.cx("fr-text--xs"))}>
                              pour la recherche{" "}
                              <a
                                href={`https://candidat.francetravail.fr/metierscope/fiche-metier/${routeParams.appellations[0].romeCode}`}
                                target="_blank"
                                className={fr.cx("fr-text--bold")}
                                rel="noreferrer"
                              >
                                {routeParams.appellations[0].appellationLabel}
                              </a>
                            </span>
                          )}
                      </>
                    )}
                  </div>
                </section>
              </form>
            </FormProvider>

            <div ref={searchResultsWrapper}>
              {searchMade !== null && (
                <div
                  ref={innerSearchResultWrapper}
                  className={fr.cx("fr-pb-1w")}
                >
                  <SearchListResults
                    route={route}
                    showDistance={areValidGeoParams(searchMade)}
                    isExternal={route.name === "externalSearch"}
                    onSearchFormSubmit={onSearchFormSubmit}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

const areValidGeoParams = (
  geoParams: Partial<LatLonDistance>,
): geoParams is LatLonDistance => {
  return (
    geoParams.latitude !== undefined &&
    geoParams.longitude !== undefined &&
    geoParams.distanceKm !== undefined &&
    geoParams.distanceKm > 0
  );
};

const areEmptyGeoParams = (
  geoParams: Partial<LatLonDistance>,
): geoParams is Partial<LatLonDistance> => {
  return (
    geoParams.latitude === undefined &&
    geoParams.longitude === undefined &&
    geoParams.distanceKm === undefined
  );
};

const canSubmitSearch = (values: SearchPageParams) => {
  const geoParams = {
    latitude: values.latitude,
    longitude: values.longitude,
    distanceKm: values.distanceKm,
  };
  return areValidGeoParams(geoParams) || areEmptyGeoParams(geoParams);
};

export const getSortedByOptions = (
  hasGeoParams: boolean,
  hasScoreEnabled: boolean,
): SelectProps.Option<SearchSortedBy>[] => [
  ...(hasScoreEnabled
    ? [
        {
          label: sortedByOptionsLabel.score,
          value: "score" as const,
        },
      ]
    : []),
  {
    label: sortedByOptionsLabel.date,
    value: "date" as const,
  },
  {
    label: sortedByOptionsLabel.distance,
    value: "distance" as const,
    disabled: !hasGeoParams,
  },
];

const sortedByOptionsLabel = {
  date: "Trier par date de publication",
  score: "Trier par pertinence",
  distance: "Trier par proximité",
};

const isSearchSortedBy = (value: string): value is SearchSortedBy =>
  searchSortedByOptions.includes(value as SearchSortedBy);

const rqthLabel = "Personnes en situation de handicap bienvenues";

type FilterAccordionProps = AccordionProps & {
  onReset?: () => void;
  values: string[];
};

type SearchFilterPanelProps = {
  initialValues: SearchPageParams;
  tempValue: SearchPageParams;
  appellationInputLabel: ReactNode;
  useNaturalLanguageForAppellations?: boolean;
  routeName: SearchRoute["name"];
  isPanelOpened: boolean;
  setIsPanelOpened: (isOpened: boolean) => void;
  appellationHintText: (useNaturalLanguageForAppellations?: boolean) => string;
  onSearchFormSubmit: (updatedValues: SearchPageParams) => void;
  setTempValue: (updatedValues: SearchPageParams) => void;
  nafOptions: NafSectionSuggestion[];
};

const getLocalisationValues = (
  place?: string,
  currentRemoteWorkModes?: RemoteWorkMode[],
): string[] => [
  ...(place ? [place] : []),
  ...((currentRemoteWorkModes || []).length === remoteWorkModes.length
    ? []
    : currentRemoteWorkModes || []),
];

const getEstablishmentAdditionalValues = (
  fitForDisabledWorkers?: FitForDisableWorkerOption[],
  showOnlyAvailableOffers?: boolean,
): string[] => [
  ...(equals(fitForDisabledWorkers, [...fitForDisabledWorkersPositiveOptions])
    ? [(fitForDisabledWorkers || []).join(", ")]
    : []),
  ...(showOnlyAvailableOffers ? [showOnlyAvailableOffers.toString()] : []),
];

const getAppellationAndNafValues = (
  appellationCodes?: string[],
  nafCodes?: string[],
): string[] => [
  ...(appellationCodes ? [appellationCodes.join(", ")] : []),
  ...(nafCodes ? [nafCodes.join(", ")] : []),
];

const SearchFilterPanel = ({
  initialValues,
  tempValue,
  appellationInputLabel,
  useNaturalLanguageForAppellations,
  routeName,
  isPanelOpened,
  setIsPanelOpened,
  appellationHintText,
  onSearchFormSubmit,
  setTempValue,
  nafOptions,
}: SearchFilterPanelProps) => {
  const {
    clearErrors,
    getValues,
    register,
    formState: { errors },
    watch,
  } = useFormContext<SearchPageParams>();
  const { isLayoutDesktop } = useLayout();
  const formValues = getValues();
  const [place] = watch(["place"]);
  const wrapperElementRef = useRef<HTMLDivElement>(null);
  const filtersSectionMaxWidth = isLayoutDesktop ? 420 : "100%";

  useLayoutEffect(() => {
    const frHeader = document.getElementById("fr-header");
    const refreshTopOffset = () => {
      if (wrapperElementRef.current) {
        wrapperElementRef.current.style.top = `${
          frHeader && frHeader.offsetHeight - window.scrollY > 0
            ? frHeader.offsetHeight - window.scrollY
            : 0
        }px`;
      }
    };

    refreshTopOffset();
    window.addEventListener("scroll", refreshTopOffset);
    window.addEventListener("resize", refreshTopOffset);

    return () => {
      window.removeEventListener("scroll", refreshTopOffset);
      window.removeEventListener("resize", refreshTopOffset);
    };
  }, []);

  return (
    <section
      ref={wrapperElementRef}
      style={{
        maxWidth: filtersSectionMaxWidth,
        position: "fixed",
        left: 0,
        top: 0,
        ...(isLayoutDesktop ? {} : { right: 0 }),
        bottom: 0,
        zIndex: 1000,
        boxShadow: "0 5px 5px 0 rgba(0,0,0,0.5)",
        backgroundColor: colors.decisions.background.default.grey.default,
        transform: `translateX(${isPanelOpened ? 0 : -100}%)`,
        transition: "transform ease .2s",
      }}
      className={fr.cx("fr-pt-6w", "fr-px-2w", "fr-pb-2w")}
    >
      <Button
        style={{ position: "absolute", top: 0, right: 0 }}
        className={fr.cx("fr-btn--close", "fr-mt-1w", "fr-mr-1w")}
        title="Fermer"
        aria-controls="shareLink"
        type="button"
        data-fr-js-modal-button="true"
        onClick={() => setIsPanelOpened(false)}
      >
        Fermer
      </Button>
      <h3 className={fr.cx("fr-h5")}>Affiner la recherche</h3>
      <div className={fr.cx("fr-accordions-group")}>
        <FilterAccordion
          label="Métier ou secteur d'activité"
          values={getAppellationAndNafValues(
            formValues.appellationCodes,
            formValues.nafCodes,
          )}
          defaultExpanded={true}
          onReset={() => {
            const updatedValues = {
              ...tempValue,
              appellations: undefined,
              appellationCodes: undefined,
            };
            onSearchFormSubmit(updatedValues);
          }}
        >
          <AppellationAutocomplete
            locator="search-form-appellation"
            className={fr.cx("fr-mb-2w")}
            label={appellationInputLabel}
            hintText={appellationHintText(useNaturalLanguageForAppellations)}
            onAppellationSelected={(appellationMatch) => {
              clearErrors("appellations");
              setTempValue({
                ...tempValue,
                appellations: [appellationMatch.appellation],
                appellationCodes: [
                  appellationMatch.appellation.appellationCode,
                ],
              });
            }}
            onAppellationClear={() => {
              setTempValue({
                ...tempValue,
                appellations: undefined,
                appellationCodes: undefined,
              });
            }}
            selectProps={{
              inputId: domElementIds[routeName].appellationAutocomplete,
              placeholder: appellationPlaceholder(
                useNaturalLanguageForAppellations,
              ),
              defaultValue: formValues.appellations?.[0]
                ? {
                    label: formValues.appellations?.[0]?.appellationLabel,
                    value: {
                      appellation: formValues.appellations?.[0],
                      matchRanges: [],
                    },
                  }
                : undefined,
            }}
            state={errors.appellations ? "error" : undefined}
            stateRelatedMessage={errors.appellations?.message}
          />
          {tempValue.appellations?.length && (
            <p className={fr.cx("fr-hint-text", "fr-mt-2w")}>
              <strong>
                Les résultats seront étendus aux autres métiers du secteur "
                {tempValue.appellations[0].romeLabel}"
              </strong>
              , c’est pour cela que vous pourrez voir des métiers proches mais
              ne correspondant pas précisément à votre recherche dans les
              résultats.
            </p>
          )}
          <Select
            label="Et / ou un secteur d'activité"
            options={nafOptions.map((option) => ({
              label: option.label,
              value: JSON.stringify({
                nafLabel: option.label,
                nafCodes: option.nafCodes,
              }),
            }))}
            nativeSelectProps={{
              id: domElementIds[routeName].nafAutocomplete,
              value:
                tempValue.nafLabel && tempValue.nafCodes
                  ? JSON.stringify({
                      nafLabel: tempValue.nafLabel,
                      nafCodes: tempValue.nafCodes,
                    })
                  : "",
              onChange: (event) => {
                const value = event.currentTarget.value;
                if (!value) {
                  setTempValue({
                    ...tempValue,
                    nafCodes: undefined,
                    nafLabel: undefined,
                  });
                  return;
                }
                const { nafLabel, nafCodes } = JSON.parse(value);
                setTempValue({
                  ...tempValue,
                  nafCodes,
                  nafLabel,
                });
              },
            }}
          />
        </FilterAccordion>
        <FilterAccordion
          label="Localisation"
          values={getLocalisationValues(
            formValues.place,
            formValues.remoteWorkModes,
          )}
          onReset={() => {
            const updatedValues: SearchPageParams =
              tempValue.sortBy === "distance"
                ? {
                    ...tempValue,
                    place: initialValues.place,
                    latitude: 0,
                    longitude: 0,
                    distanceKm: 0,
                  }
                : {
                    ...tempValue,
                    place: initialValues.place,
                    latitude: initialValues.latitude,
                    longitude: initialValues.longitude,
                    distanceKm: undefined,
                  };
            onSearchFormSubmit(updatedValues);
          }}
        >
          <PlaceAutocomplete
            locator="search-form-place"
            label={placeInputLabel}
            hintText={placeHintText}
            onPlaceSelected={(lookupSearchResult) => {
              clearErrors("place");
              if (!lookupSearchResult) return;
              const newValues = {
                place: lookupSearchResult.label,
                latitude: lookupSearchResult.position.lat,
                longitude: lookupSearchResult.position.lon,
              };
              setTempValue({
                ...tempValue,
                ...newValues,
                distanceKm: tempValue.distanceKm || DEFAULT_DISTANCE_KM,
              });
            }}
            onPlaceClear={() => {
              const updatedInitialValues: SearchPageParams =
                tempValue.sortBy === "distance"
                  ? {
                      ...tempValue,
                      place: initialValues.place,
                      latitude: 0,
                      longitude: 0,
                      distanceKm: 0,
                    }
                  : {
                      ...tempValue,
                      place: initialValues.place,
                      latitude: initialValues.latitude,
                      longitude: initialValues.longitude,
                      distanceKm: undefined,
                    };
              setTempValue(updatedInitialValues);

              if (formValues.sortBy === "distance") {
                setTempValue({
                  ...tempValue,
                  sortBy: "date",
                });
              }
            }}
            className={fr.cx("fr-mt-2w")}
            initialInputValue={place}
            selectProps={{
              inputId: domElementIds[routeName].placeAutocompleteInput,
              defaultValue:
                place && formValues.latitude && formValues.longitude
                  ? {
                      label: place,
                      value: {
                        label: place,
                        position: {
                          lat: formValues.latitude,
                          lon: formValues.longitude,
                        },
                      },
                    }
                  : undefined,
            }}
            state={errors.place ? "error" : undefined}
            stateRelatedMessage={errors.place?.message}
          />

          <Select
            label="Dans un rayon de :"
            options={radiusOptions}
            disabled={!tempValue.latitude || !tempValue.longitude}
            hint={radiusHintText}
            nativeSelectProps={{
              ...register("distanceKm"),
              title:
                !tempValue.latitude || !tempValue.longitude
                  ? "Pour sélectionner une distance, vous devez d'abord définir une ville."
                  : undefined,
              id: domElementIds[routeName].distanceSelect,
              value: `${tempValue.distanceKm || ""}`,
              onChange: (event) => {
                const value = Number.parseInt(event.currentTarget.value, 10);
                setTempValue({
                  ...tempValue,
                  distanceKm: value,
                });
                if (!value) {
                  setTempValue({
                    ...tempValue,
                    distanceKm: value,
                  });
                }
              },
            }}
          />
          <p className={fr.cx("fr-text--bold", "fr-mt-2w")}>
            Quelle(s) offre(s) souhaitez-vous voir ?
          </p>
          <Checkbox
            options={remoteWorkModes.map((mode) => ({
              label: remoteWorkModeLabels[mode].label,
              nativeInputProps: {
                checked: tempValue.remoteWorkModes?.includes(mode),
                onChange: () => {
                  const remoteWorkModesArray = tempValue.remoteWorkModes || [];
                  setTempValue({
                    ...tempValue,
                    remoteWorkModes: tempValue.remoteWorkModes?.includes(mode)
                      ? remoteWorkModesArray.filter((m) => m !== mode)
                      : [...remoteWorkModesArray, mode],
                  });
                },
              },
            }))}
          />
        </FilterAccordion>
        <FilterAccordion
          label="Caractéristiques de l'entreprise"
          values={getEstablishmentAdditionalValues(
            formValues.fitForDisabledWorkers,
            formValues.showOnlyAvailableOffers,
          )}
          onReset={() => {
            const updatedValues = {
              ...tempValue,
              fitForDisabledWorkers: undefined,
            };
            onSearchFormSubmit(updatedValues);
          }}
        >
          <p className={fr.cx("fr-mb-2w")}>
            Afficher uniquement les entreprises&nbsp;:
          </p>
          <Checkbox
            className={fr.cx("fr-mb-2w")}
            options={[
              {
                label: rqthLabel,
                nativeInputProps: {
                  checked:
                    tempValue.fitForDisabledWorkers?.some(
                      (fitForDisabledWorker) =>
                        fitForDisabledWorker === "yes-declared-only" ||
                        fitForDisabledWorker === "yes-ft-certified",
                    ) ?? false,
                  onChange: (event) => {
                    setTempValue({
                      ...tempValue,
                      fitForDisabledWorkers: event.currentTarget.checked
                        ? [...fitForDisabledWorkersPositiveOptions]
                        : ["no"],
                    });
                  },
                },
              },
            ]}
          />
          <Checkbox
            className={fr.cx("fr-mb-2w")}
            options={[
              {
                label: "Mises en relation disponibles",
                nativeInputProps: {
                  checked: tempValue.showOnlyAvailableOffers,
                  onChange: (event) => {
                    setTempValue({
                      ...tempValue,
                      showOnlyAvailableOffers: event.currentTarget.checked,
                    });
                  },
                },
              },
            ]}
          />
        </FilterAccordion>
      </div>
    </section>
  );
};

const FilterAccordion = ({
  children,
  onReset,
  values,
  ...accordionProps
}: FilterAccordionProps) => {
  const countValues = values?.length || 0;
  const hasValue = countValues > 0;

  const buttons: [ButtonProps, ...ButtonProps[]] = [
    {
      children: "Appliquer",
      type: "submit",
      className: fr.cx("fr-mb-0"),
      id: `${accordionProps.id}-submit-button`,
    },
  ];
  if (onReset) {
    buttons.unshift({
      children: "Réinitialiser",
      type: "button",
      priority: "tertiary",
      onClick: () => {
        onReset();
      },
      className: fr.cx("fr-mb-0"),
      disabled: !hasValue,
      id: `${accordionProps.id}-reset-button`,
    });
  }
  return (
    <Accordion
      {...accordionProps}
      label={accordionProps.label + (countValues ? ` (${countValues})` : "")}
    >
      {children}
      <ButtonsGroup
        className={fr.cx("fr-hr", "fr-pt-2w", "fr-pb-0")}
        inlineLayoutWhen="always"
        alignment="right"
        buttons={buttons}
      />
    </Accordion>
  );
};
