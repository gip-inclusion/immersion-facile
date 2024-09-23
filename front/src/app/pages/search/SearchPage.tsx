import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select, SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { includes, keys } from "ramda";
import React, { ElementRef, useEffect, useRef, useState } from "react";
import {
  Loader,
  MainWrapper,
  PageHeader,
  SectionAccordion,
  SectionTextEmbed,
} from "react-design-system";
import { useForm, useWatch } from "react-hook-form";
import { useDispatch } from "react-redux";
import { LatLonDistance, SearchSortedBy, ValueOf, domElementIds } from "shared";
import { AppellationAutocomplete } from "src/app/components/forms/autocomplete/AppellationAutocomplete";
import { PlaceAutocomplete } from "src/app/components/forms/autocomplete/PlaceAutocomplete";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { SearchInfoSection } from "src/app/components/search/SearchInfoSection";
import { SearchListResults } from "src/app/components/search/SearchListResults";
import { useGetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  encodedSearchUriParams,
  useSearchUseCase,
} from "src/app/hooks/search.hooks";
import { routes } from "src/app/routes/routes";
import { featureFlagSelectors } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import {
  SearchPageParams,
  initialState,
  searchSlice,
} from "src/core-logic/domain/search/search.slice";
import { useStyles } from "tss-react/dsfr";
import { Route } from "type-route";
import "./SearchPage.scss";
import Styles from "./SearchPage.styles";

const radiusOptions = ["1", "2", "5", "10", "20", "50", "100"].map(
  (distance) => ({
    label: `${distance} km`,
    value: distance,
  }),
);

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

export const SearchPage = ({
  route,
  useNaturalLanguageForAppellations,
}: {
  route: Route<typeof routes.search | typeof routes.searchDiagoriente>;
  useNaturalLanguageForAppellations?: boolean;
}) => {
  const { cx } = useStyles();
  const dispatch = useDispatch();
  const initialSearchSliceState = initialState;
  const searchStatus = useAppSelector(searchSelectors.searchStatus);
  const searchResults = useAppSelector(searchSelectors.searchResults);
  const requestSearch = useSearchUseCase(route);
  const [searchMade, setSearchMade] = useState<SearchPageParams | null>(null);
  const searchResultsWrapper = useRef<ElementRef<"div">>(null);
  const innerSearchResultWrapper = useRef<ElementRef<"div">>(null);
  const acquisitionParams = useGetAcquisitionParams();
  const initialValues: SearchPageParams = {
    place: "",
    sortedBy: "date",
    appellations: undefined,
    distanceKm: undefined,
    latitude: undefined,
    longitude: undefined,
    ...acquisitionParams,
  };

  const filterFormValues = (values: SearchPageParams) =>
    keys(values).reduce(
      (acc, key) => ({
        ...acc,
        ...(values[key] ? { [key]: values[key] } : {}),
      }),
      {} as SearchPageParams,
    );
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
  const [lat, lon, distanceKm] = useWatch({
    control,
    name: ["latitude", "longitude", "distanceKm"],
  });

  const availableForInitialSearchRequest =
    keys(routeParams).length &&
    searchStatus === initialSearchSliceState.searchStatus &&
    lat !== 0 &&
    lon !== 0;

  const getSearchResultsSummary = (resultsNumber: number) => {
    const plural = resultsNumber > 1 ? "s" : "";
    return (
      <>
        <strong>{resultsNumber}</strong> résultat{plural} trouvé{plural}
      </>
    );
  };

  const triggerSearch = (values: SearchPageParams) => {
    setSearchMade(values);
    requestSearch(filterFormValues(values));
  };

  useEffect(() => {
    if (availableForInitialSearchRequest) {
      triggerSearch(filterFormValues(formValues));
    }
  }, [
    availableForInitialSearchRequest,
    triggerSearch,
    filterFormValues,
    formValues,
  ]);

  useEffect(() => {
    return () => {
      dispatch(searchSlice.actions.clearSearchStatus());
    };
  }, [dispatch]);

  return (
    <HeaderFooterLayout>
      <MainWrapper vSpacing={0} layout="fullscreen">
        <PageHeader title="Je trouve une entreprise pour réaliser mon immersion professionnelle">
          <form
            onSubmit={handleSubmit((value) =>
              triggerSearch(filterFormValues(value)),
            )}
            className={cx(
              fr.cx("fr-grid-row", "fr-grid-row--gutters"),
              Styles.form,
              Styles.formV2,
            )}
            id={domElementIds.search.searchForm}
          >
            <div className={cx(fr.cx("fr-col-12", "fr-col-lg-4"))}>
              <AppellationAutocomplete
                label={
                  useNaturalLanguageForAppellations
                    ? "Je recherche le métier ou la compétence :"
                    : "Je recherche le métier :"
                }
                initialValue={
                  formValues.appellations
                    ? formValues.appellations[0]
                    : undefined
                }
                onAppellationSelected={(newAppellationAndRome) => {
                  setValue("appellations", [newAppellationAndRome]);
                }}
                selectedAppellations={
                  formValues.appellations
                    ? [formValues.appellations[0]]
                    : undefined
                }
                onInputClear={() => {
                  setValue("appellations", undefined);
                }}
                id={domElementIds.search.appellationAutocomplete}
                placeholder={
                  useNaturalLanguageForAppellations
                    ? "Ex: boulanger, faire du pain, etc"
                    : "Ex: boulanger, styliste, etc"
                }
                useNaturalLanguage={useNaturalLanguageForAppellations}
              />
            </div>
            <div className={cx(fr.cx("fr-col-12", "fr-col-lg-4"))}>
              <PlaceAutocomplete
                label="Je me situe dans la ville de :"
                initialInputValue={formValues.place}
                onValueChange={(lookupSearchResult) => {
                  if (!lookupSearchResult) return;
                  setValue("latitude", lookupSearchResult.position.lat);
                  setValue("longitude", lookupSearchResult.position.lon);
                  setValue("place", lookupSearchResult.label);
                  if (!formValues.distanceKm) {
                    setValue("distanceKm", 10);
                  }
                }}
                id={domElementIds.search.placeAutocompleteInput}
                onInputClear={() => {
                  setValue("latitude", initialValues.latitude);
                  setValue("longitude", initialValues.latitude);
                  setValue("place", initialValues.place);
                  if (formValues.sortedBy === "distance") {
                    setValue("sortedBy", "date");
                  }
                  setValue("distanceKm", initialValues.distanceKm);
                }}
              />
            </div>
            <div className={cx(fr.cx("fr-col-12", "fr-col-lg-2"))}>
              <Select
                label="Distance maximum"
                options={radiusOptions}
                disabled={!lat || !lon}
                nativeSelectProps={{
                  ...register("distanceKm"),
                  title:
                    !lat || !lon
                      ? "Pour sélectionner une distance, vous devez d'abord définir une ville."
                      : undefined,
                  id: domElementIds.search.distanceSelect,
                  value: `${distanceKm === undefined ? "" : distanceKm}`,
                  onChange: (event) => {
                    const value = parseInt(event.currentTarget.value);
                    setValue("distanceKm", value);
                    if (!value) {
                      setValue("sortedBy", "date");
                    }
                  },
                }}
              />
            </div>

            <div className={cx(fr.cx("fr-col-12", "fr-col-lg-2"))}>
              <Button
                type="submit"
                nativeButtonProps={{
                  id: domElementIds.search.searchSubmitButton,
                }}
                disabled={!canSubmitSearch(formValues)}
              >
                Rechercher
              </Button>
            </div>
          </form>
        </PageHeader>
        <div ref={searchResultsWrapper}>
          {searchStatus === "ok" && searchMade !== null && (
            <div
              ref={innerSearchResultWrapper}
              className={fr.cx("fr-pt-6w", "fr-pb-1w")}
            >
              <div className={fr.cx("fr-container")}>
                <div
                  className={fr.cx(
                    "fr-grid-row",
                    "fr-grid-row--gutters",
                    "fr-grid-row--middle",
                    "fr-mb-4w",
                  )}
                >
                  <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
                    <SearchSortedBySelect
                      searchValues={formValues}
                      triggerSearch={triggerSearch}
                      setSortedBy={(sortedBy: SearchSortedBy) =>
                        setValue("sortedBy", sortedBy)
                      }
                    />
                  </div>
                  <div
                    className={cx(
                      fr.cx(
                        "fr-col-12",
                        "fr-col-md-5",
                        "fr-grid-row",
                        "fr-grid-row--right",
                        "fr-ml-auto",
                      ),
                      Styles.resultsSummary,
                    )}
                  >
                    {searchStatus === "ok" && (
                      <>
                        <h2 className={fr.cx("fr-h5", "fr-mb-0")}>
                          {getSearchResultsSummary(searchResults.length)}
                        </h2>
                        {routeParams.appellations &&
                          routeParams.appellations.length > 0 && (
                            <span className={cx(fr.cx("fr-text--xs"))}>
                              pour la recherche{" "}
                              <strong className={fr.cx("fr-text--bold")}>
                                {routeParams.appellations[0].appellationLabel}
                              </strong>
                              , étendue au secteur{" "}
                              <a
                                href={`https://candidat.francetravail.fr/metierscope/fiche-metier/${routeParams.appellations[0].romeCode}`}
                                target="_blank"
                                className={fr.cx("fr-text--bold")}
                                rel="noreferrer"
                              >
                                {routeParams.appellations[0].romeLabel}
                              </a>
                            </span>
                          )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <SearchListResults showDistance={areValidGeoParams(searchMade)} />
            </div>
          )}
          {searchStatus === "extraFetch" ||
            (searchStatus === "initialFetch" && <Loader />)}

          {searchMade === null && (
            <div className={fr.cx("fr-pt-10w")}>
              <SearchInfoSection />
              <SectionAccordion />
              <SectionTextEmbed
                videoUrl="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise.mp4"
                videoPosterUrl="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_poster.webp"
                videoDescription="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_transcript.vtt"
                videoTranscription="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_transcript.txt"
              />
            </div>
          )}
        </div>
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

const getSortedByOptions = (
  hasGeoParams: boolean,
  hasScoreEnabled: boolean,
): SelectProps.Option<SearchSortedBy>[] => [
  {
    label: "Trier par date de publication",
    value: "date" as const,
  },
  ...(hasScoreEnabled
    ? [
        {
          label: "Trier par pertinence",
          value: "score" as const,
        },
      ]
    : []),
  ...(hasGeoParams
    ? [
        {
          label: "Trier par proximité",
          value: "distance" as const,
        },
      ]
    : []),
];

const SearchSortedBySelect = ({
  triggerSearch,
  searchValues,
  setSortedBy,
}: {
  searchValues: SearchPageParams;
  triggerSearch: (values: SearchPageParams) => void;
  setSortedBy: (sortedBy: SearchSortedBy) => void;
}) => {
  const { sortedBy } = searchValues;
  const { enableSearchByScore } = useAppSelector(
    featureFlagSelectors.featureFlagState,
  );
  const filteredOptions = getSortedByOptions(
    areValidGeoParams(searchValues),
    enableSearchByScore.isActive,
  );
  return (
    <Select
      label="Trier les résultats"
      options={filteredOptions}
      nativeSelectProps={{
        id: domElementIds.search.sortFilter,
        value: sortedBy,
        onChange: (event) => {
          const value = event.currentTarget.value;
          setSortedBy(value);
          if (value === "distance") {
            if (areValidGeoParams(searchValues)) {
              triggerSearch({
                ...searchValues,
                sortedBy: value,
              });
            }
            return;
          }
          triggerSearch({
            ...searchValues,
            sortedBy: value,
          });
        },
      }}
    />
  );
};
