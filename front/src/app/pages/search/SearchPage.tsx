import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { keys } from "ramda";
import React, { useEffect, useRef } from "react";
import { Loader, MainWrapper } from "react-design-system";
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useMapEvents } from "react-leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useDispatch } from "react-redux";
import { SearchResultDto, domElementIds } from "shared";
import { AppellationAutocomplete } from "src/app/components/forms/autocomplete/AppellationAutocomplete";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { SearchResult } from "src/app/components/search/SearchResult";
import { useGetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useSearchUseCase } from "src/app/hooks/search.hooks";
import { routes } from "src/app/routes/routes";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import {
  SearchPageParams,
  initialState,
} from "src/core-logic/domain/search/search.slice";
import { searchSlice } from "src/core-logic/domain/search/search.slice";
import { useStyles } from "tss-react/dsfr";
import { Route } from "type-route";
import "./SearchPage.scss";
import Styles from "./SearchPage.styles";

const defaultMarkerIcon = L.icon({
  iconUrl: "/marker-icon-2x.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const lbbMarkerIcon = L.icon({
  iconUrl: "/marker-icon-2x--purple.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const activeMarkerIcon = L.icon({
  iconUrl: "/marker-icon-2x--green.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
  const loading = useAppSelector(searchSelectors.isLoading);
  const triggerSearch = useSearchUseCase(route);
  const acquisitionParams = useGetAcquisitionParams();
  const initialValues: SearchPageParams = {
    latitude: 48.8535,
    longitude: 2.34839,
    distanceKm: 100,
    place: "",
    sortedBy: "distance",
    appellations: undefined,
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
        [currentKey]: routeParams[currentKey] ?? initialValues[currentKey],
      }),
      {},
    ),
    mode: "onTouched",
  });
  const { handleSubmit, setValue, control, getValues } = methods;
  const formValues = getValues();
  const [lat, lon] = useWatch({
    control,
    name: ["latitude", "longitude"],
  });
  const [activeMarkerKey, setActiveMarkerKey] = React.useState<string | null>(
    null,
  );
  const distance = useWatch({
    control,
    name: "distanceKm",
  });

  const availableForInitialSearchRequest =
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

  useEffect(() => {
    triggerSearch(
      filterFormValues({
        ...formValues,
        latitude: lat,
        longitude: lon,
        distanceKm: distance,
      }),
    );
  }, [distance, lat, lon]);

  return (
    <HeaderFooterLayout>
      {loading && <Loader />}
      <MainWrapper vSpacing={0} layout="fullscreen">
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit((value) =>
              triggerSearch(filterFormValues(value)),
            )}
            className={cx(Styles.form, Styles.formV2)}
            id={domElementIds.search.searchForm}
            style={
              activeMarkerKey
                ? {
                    top: "-8rem",
                  }
                : {}
            }
          >
            <AppellationAutocomplete
              label="Je recherche le métier :"
              initialValue={
                formValues.appellations ? formValues.appellations[0] : undefined
              }
              onAppellationSelected={(newAppellationAndRome) => {
                setValue("appellations", [newAppellationAndRome]);
                triggerSearch(
                  filterFormValues({
                    ...formValues,
                    appellations: [newAppellationAndRome],
                  }),
                );
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
          </form>
          <SearchMapResults
            activeMarkerKey={activeMarkerKey}
            setActiveMarkerKey={setActiveMarkerKey}
          />
        </FormProvider>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

const SearchMapResults = ({
  activeMarkerKey,
  setActiveMarkerKey,
}: {
  activeMarkerKey: string | null;
  setActiveMarkerKey: (key: string | null) => void;
}) => {
  const searchResultsWrapper = useRef<HTMLDivElement>(null);
  const searchResults = useAppSelector(searchSelectors.searchResults);
  const searchParams = useAppSelector(searchSelectors.searchParams);
  const mapRef = useRef<L.Map | null>(null);
  const dispatch = useDispatch();
  const getIconMarker = (searchResult: SearchResultDto, key: string) => {
    if (activeMarkerKey === key) {
      return activeMarkerIcon;
    }
    return searchResult.voluntaryToImmersion
      ? defaultMarkerIcon
      : lbbMarkerIcon;
  };
  if (searchParams.latitude === 0 && searchParams.longitude === 0) {
    return null;
  }
  return (
    <div ref={searchResultsWrapper}>
      <div className="search-map-results">
        <MapContainer
          scrollWheelZoom={false}
          style={{ height: "75vh", width: "100%" }}
          center={[searchParams.latitude, searchParams.longitude]}
          zoom={10}
          touchZoom={true}
          minZoom={6}
          ref={mapRef}
        >
          <ZoomEvent setActiveMarkerKey={setActiveMarkerKey} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {searchResults.map((searchResult, index) => {
            const key = searchResult.locationId
              ? `${searchResult.locationId}-${index}`
              : `lbb-${index}`;
            return (
              <Marker
                key={key}
                position={[
                  searchResult.position.lat,
                  searchResult.position.lon,
                ]}
                icon={getIconMarker(searchResult, key)}
                eventHandlers={{
                  click: () => {
                    setActiveMarkerKey(key);
                  },
                }}
              >
                <Popup>
                  <SearchResult
                    key={`${searchResult.siret}-${searchResult.rome}`} // Should be unique !
                    establishment={searchResult}
                    layout="fr-col-12"
                    onButtonClick={() => {
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
                  />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

const ZoomEvent = ({
  setActiveMarkerKey,
}: {
  setActiveMarkerKey: (key: string | null) => void;
}) => {
  const { setValue } = useFormContext<SearchPageParams>();
  useMapEvents({
    popupclose: () => {
      setActiveMarkerKey(null);
    },
    zoomend: (event) => {
      const zoom: number = event.target.getZoom();

      setValue("distanceKm", zoomToRadiusOptions[zoom]);
    },
    dragend: (event) => {
      const center = event.target.getCenter();
      setValue("latitude", center.lat);
      setValue("longitude", center.lng);
      setActiveMarkerKey(null);
    },
  });
  return null;
};

const zoomToRadiusOptions: Record<number, number> = {
  18: 1,
  17: 1,
  16: 1,
  15: 2,
  14: 5,
  13: 10,
  12: 20,
  11: 50,
  10: 75,
  9: 100,
  8: 200,
  7: 400,
  6: 1000,
  5: 100,
  4: 100,
  3: 100,
  2: 100,
  1: 100,
  0: 100,
};
