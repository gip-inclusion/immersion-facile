import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  Marker,
  MarkerProps,
  Popup,
  TileLayer,
} from "react-leaflet";
import { SearchResultDto } from "shared";
import { SearchResult } from "src/app/components/search/SearchResult";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import { SearchPageParams } from "src/core-logic/domain/search/search.slice";
import { useStyles } from "tss-react/dsfr";
import "./SearchMiniMap.scss";

type SearchMiniMapListProps = {
  kind: "list";
  activeMarkerKey: string | null;
  setActiveMarkerKey: (key: string | null) => void;
  markerProps?: never;
};

type SearchMiniMapSingleProps = {
  kind: "single";
  markerProps: MarkerProps;
  activeMarkerKey?: never;
  setActiveMarkerKey?: never;
};

type SearchMiniMapProps = SearchMiniMapListProps | SearchMiniMapSingleProps;

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
  iconUrl: "/marker-icon-2x--active.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const getIconMarker = (
  activeMarkerKey: string | undefined | null,
  searchResult: SearchResultDto,
  key: string,
) => {
  if (activeMarkerKey === key) {
    return activeMarkerIcon;
  }
  return searchResult.voluntaryToImmersion ? defaultMarkerIcon : lbbMarkerIcon;
};

const getDefaultZoomLevel = (
  kind: SearchMiniMapProps["kind"],
  distanceKm: SearchPageParams["distanceKm"],
) => {
  if (kind === "single") {
    return 17;
  }
  return distanceKm ? distanceToZoomOptions[distanceKm] : 5;
};

export const SearchMiniMap = ({
  kind,
  activeMarkerKey,
  setActiveMarkerKey,
  markerProps,
}: SearchMiniMapProps) => {
  const searchResultsWrapper = useRef<HTMLDivElement>(null);
  const searchResults = useAppSelector(searchSelectors.searchResults);
  const searchParams = useAppSelector(searchSelectors.searchParams);
  const mapRef = useRef<L.Map | null>(null);
  const { cx } = useStyles();

  const { latitude, longitude } = {
    latitude: searchParams.latitude ?? 48.8589384,
    longitude: searchParams.longitude ?? 2.2646348,
  };

  const zoom = useMemo(
    () => getDefaultZoomLevel(kind, searchParams.distanceKm),
    [kind, searchParams],
  );

  useEffect(() => {
    const latLon = markerProps
      ? markerProps.position
      : ([latitude, longitude] as L.LatLngExpression);
    mapRef.current?.setView(latLon, zoom);
  }, [markerProps, zoom, latitude, longitude]);

  return (
    <div ref={searchResultsWrapper} key={`map-${kind}`}>
      <div className={cx("search-map-results")}>
        <MapContainer
          className={cx("search-map-results__map")}
          scrollWheelZoom={false}
          center={
            kind === "single" ? markerProps.position : [latitude, longitude]
          }
          zoom={zoom}
          touchZoom={true}
          minZoom={5}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markerProps && (
            <Marker position={markerProps.position} icon={markerProps.icon} />
          )}
          {!markerProps &&
            searchResults.map((searchResult, index) => {
              const key = searchResult.locationId
                ? `${searchResult.locationId}-${index}`
                : `lbb-${index}`;
              const appellations = searchResult.appellations;
              const searchResultAppellationCode = appellations?.length
                ? appellations[0].appellationCode
                : null;
              const appellationCode =
                searchResultAppellationCode ||
                searchParams.appellationCodes?.[0];
              return (
                <Marker
                  key={key}
                  position={[
                    searchResult.position.lat,
                    searchResult.position.lon,
                  ]}
                  icon={getIconMarker(activeMarkerKey, searchResult, key)}
                  eventHandlers={{
                    click: () => {
                      if (setActiveMarkerKey) {
                        setActiveMarkerKey(key);
                      }
                    },
                  }}
                >
                  <Popup>
                    <SearchResult
                      key={`${searchResult.siret}-${searchResult.rome}`} // Should be unique !
                      establishment={searchResult}
                      linkProps={
                        searchResult.voluntaryToImmersion
                          ? routes.searchResult({
                              appellationCode: appellationCode ?? "",
                              siret: searchResult.siret,
                              ...(searchResult.locationId
                                ? { location: searchResult.locationId }
                                : {}),
                            }).link
                          : routes.searchResultExternal({
                              siret: searchResult.siret,
                              appellationCode: appellationCode ?? "",
                            }).link
                      }
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
const distanceToZoomOptions: Record<number, number> = {
  1: 16,
  2: 14,
  5: 12,
  10: 11,
  20: 10,
  50: 9,
  100: 8,
};
