import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import "leaflet/dist/leaflet.css";
import { keys } from "ramda";
import React, { useEffect, useRef } from "react";
import {
  Loader,
  MainWrapper,
  PageHeader,
  SectionAccordion,
  SectionTextEmbed,
} from "react-design-system";
import { useForm, useWatch } from "react-hook-form";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useDispatch } from "react-redux";
import { GeoPositionDto, domElementIds } from "shared";
import { AppellationAutocomplete } from "src/app/components/forms/autocomplete/AppellationAutocomplete";
import { PlaceAutocomplete } from "src/app/components/forms/autocomplete/PlaceAutocomplete";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { SearchInfoSection } from "src/app/components/search/SearchInfoSection";
import { SearchListResults } from "src/app/components/search/SearchListResults";
import { useGetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useSearchUseCase } from "src/app/hooks/search.hooks";
import { routes } from "src/app/routes/routes";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import {
  SearchPageParams,
  SearchStatus,
  initialState,
} from "src/core-logic/domain/search/search.slice";
import { searchSlice } from "src/core-logic/domain/search/search.slice";
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

export const SearchPage = ({
  route,
  useNaturalLanguageForAppellations,
}: {
  route: Route<typeof routes.search | typeof routes.searchDiagoriente>;
  useNaturalLanguageForAppellations?: boolean;
}) => {
  const { cx } = useStyles();
  const initialSearchSliceState = initialState;
  const searchStatus = useAppSelector(searchSelectors.searchStatus);
  const triggerSearch = useSearchUseCase(route);
  const searchResultsWrapper = useRef<HTMLDivElement>(null);
  const acquisitionParams = useGetAcquisitionParams();
  const initialValues: SearchPageParams = {
    latitude: 0,
    longitude: 0,
    distanceKm: 10,
    place: "",
    sortedBy: "distance",
    appellations: undefined,
    ...acquisitionParams,
  };
  const availableForSearchRequest = (
    searchStatus: SearchStatus,
    { lat, lon }: GeoPositionDto,
  ): boolean =>
    searchStatus !== "initialFetch" &&
    searchStatus !== "extraFetch" &&
    lon !== 0 &&
    lat !== 0;

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
        [currentKey]: routeParams[currentKey] ?? initialValues[currentKey],
      }),
      {},
    ),
    mode: "onTouched",
  });
  const { handleSubmit, setValue, register, control, getValues } = methods;
  const formValues = getValues();
  const [lat, lon] = useWatch({
    control,
    name: ["latitude", "longitude"],
  });

  const availableForInitialSearchRequest =
    keys(routeParams).length &&
    searchStatus === initialSearchSliceState.searchStatus &&
    lat !== 0 &&
    lon !== 0;

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

  return (
    <HeaderFooterLayout>
      <MainWrapper vSpacing={0} layout="fullscreen">
        <PageHeader
          title="Je trouve une entreprise pour réaliser mon immersion professionnelle"
          theme="candidate"
        >
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
                label="Je recherche le métier :"
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
                placeholder="Ex: boulanger, styliste, etc"
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
                }}
                id={domElementIds.search.placeAutocompleteInput}
                onInputClear={() => {
                  setValue("latitude", initialValues.latitude);
                  setValue("longitude", initialValues.latitude);
                  setValue("place", initialValues.place);
                }}
              />
            </div>
            <div className={cx(fr.cx("fr-col-12", "fr-col-lg-2"))}>
              <Select
                label="Distance maximum"
                placeholder="Distance"
                options={radiusOptions}
                nativeSelectProps={{
                  ...register("distanceKm"),
                  id: domElementIds.search.distanceSelect,
                }}
              />
            </div>

            <div className={cx(fr.cx("fr-col-12", "fr-col-lg-2"))}>
              <Button
                disabled={
                  !availableForSearchRequest(searchStatus, { lat, lon })
                }
                type="submit"
                nativeButtonProps={{
                  id: domElementIds.search.searchSubmitButton,
                }}
              >
                Rechercher
              </Button>
            </div>
          </form>
        </PageHeader>
        <div ref={searchResultsWrapper}>
          {searchStatus === "ok" && (
            <div className={fr.cx("fr-grid-row")}>
              <div
                className={fr.cx("fr-col-4")}
                style={{
                  overflowY: "auto",
                  height: "100vh",
                }}
              >
                <SearchListResults />
              </div>
              <div className={fr.cx("fr-col-8")}>
                <SearchMapResults />
              </div>
            </div>
          )}
          {searchStatus === "extraFetch" ||
            (searchStatus === "initialFetch" && <Loader />)}

          <SearchInfoSection />
          <SectionAccordion />
          <SectionTextEmbed
            videoUrl="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise.mp4"
            videoPosterUrl="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_poster.webp"
            videoDescription="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_transcript.vtt"
            videoTranscription="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_transcript.txt"
          />
        </div>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

const radiusOptionsToZoomLevelStrategy: Record<
  (typeof radiusOptions)[0]["value"],
  number
> = {
  "1": 14,
  "2": 13,
  "5": 12,
  "10": 11,
  "20": 10,
  "50": 9,
  "100": 8,
};

const SearchMapResults = () => {
  const searchResultsWrapper = useRef<HTMLDivElement>(null);
  const searchResults = useAppSelector(searchSelectors.searchResults);
  const searchParams = useAppSelector(searchSelectors.searchParams);
  const dispatch = useDispatch();
  return (
    <div ref={searchResultsWrapper}>
      <div className="search-map-results">
        <MapContainer
          scrollWheelZoom={false}
          style={{ height: "100vh", width: "100%" }}
          center={[searchParams.latitude, searchParams.longitude]}
          zoom={radiusOptionsToZoomLevelStrategy[`${searchParams.distanceKm}`]}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {searchResults.map((searchResult) => (
            <Marker
              key={searchResult.locationId}
              position={[searchResult.position.lat, searchResult.position.lon]}
            >
              <Popup>
                <h1>{searchResult.name}</h1>
                <p>{searchResult.address.streetNumberAndAddress}</p>
                <p>{searchResult.address.city}</p>
                <Button
                  onClick={() => {
                    const appellations = searchResult.appellations;
                    const appellationCode = appellations?.length
                      ? appellations[0].appellationCode
                      : null;
                    if (appellationCode && searchResult.locationId) {
                      routes
                        .searchResult({
                          siret: searchResult.siret,
                          appellationCode,
                          location: searchResult.locationId,
                        })
                        .push();
                      return;
                    }
                    dispatch(
                      searchSlice.actions.fetchSearchResultRequested(
                        searchResult,
                      ),
                    );
                    routes
                      .searchResultExternal({
                        siret: searchResult.siret,
                      })
                      .push();
                  }}
                >
                  Voir la fiche
                </Button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
