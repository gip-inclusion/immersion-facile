import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  type MarkerProps,
  Popup,
  TileLayer,
} from "react-leaflet";
import { domElementIds, frontRoutes } from "shared";
import { SearchResult } from "src/app/components/search/SearchResult";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import type { SearchPageParams } from "src/core-logic/domain/search/search.slice";
import { useStyles } from "tss-react/dsfr";
import "./SearchMiniMap.scss";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createPortal } from "react-dom";

type SearchMiniMapListProps = {
  kind: "list";
  markerProps?: never;
  isExternal: boolean;
};

type SearchMiniMapSingleProps = {
  kind: "single";
  markerProps: MarkerProps;
  isExternal: boolean;
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
  isExternal: boolean,
  key: string,
) => {
  if (activeMarkerKey === key) {
    return activeMarkerIcon;
  }
  return isExternal ? lbbMarkerIcon : defaultMarkerIcon;
};

const getDefaultZoomLevel = (
  kind: SearchMiniMapProps["kind"],
  distanceKm: SearchPageParams["distanceKm"],
) => {
  if (kind === "single") {
    return 17;
  }
  return distanceKm ? distanceToZoomOptions[distanceKm] : 10;
};

export const SearchMiniMap = ({
  kind,
  markerProps,
  isExternal,
}: SearchMiniMapProps) => {
  const searchResultsWrapper = useRef<HTMLDivElement>(null);
  const { data: searchResults } = useAppSelector(
    searchSelectors.searchResultsWithPagination,
  );
  const searchParams = useAppSelector(searchSelectors.searchParams);
  const mapRef = useRef<L.Map | null>(null);
  const { cx } = useStyles();
  const [isMapOpened, setIsMapOpened] = useState(false);

  const { latitude, longitude } = {
    latitude: searchParams.latitude ?? 48.8589384,
    longitude: searchParams.longitude ?? 2.2646348,
  };

  const [activeMarkerKey, setActiveMarkerKey] = useState<string | null>(null);

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

  const mapJsx = (
    <div ref={searchResultsWrapper} key={`map-${kind}`}>
      <div
        className={cx(
          "search-map-results",
          isMapOpened && "search-map-results--opened",
        )}
      >
        {/* biome-ignore lint/a11y/useSemanticElements: div overlay avoids DSFR global button hover styles */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Fermer la carte"
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            setIsMapOpened(false);
          }}
          className={cx("search-map-results__overlay")}
          onClick={() => setIsMapOpened(false)}
        />
        <div className={cx("search-map-results__inner")}>
          <Button
            priority="tertiary"
            size="small"
            className={cx(
              fr.cx("fr-ml-auto", "fr-btn--close"),
              "search-map-results__close-button",
            )}
            type="button"
            onClick={() => setIsMapOpened(false)}
          >
            Fermer
          </Button>
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
                    icon={getIconMarker(activeMarkerKey, isExternal, key)}
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
                        searchResult={searchResult}
                        linkProps={
                          searchResult.voluntaryToImmersion
                            ? frontRoutes.searchResult({
                                appellationCode: [appellationCode ?? ""],
                                siret: searchResult.siret,
                                ...(searchResult.locationId
                                  ? { location: searchResult.locationId }
                                  : {}),
                              }).link
                            : frontRoutes.searchResultExternal({
                                siret: searchResult.siret,
                                appellationCode: [appellationCode ?? ""],
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
    </div>
  );
  return (
    <>
      <Button
        id={domElementIds.search.openMapButton}
        title="Visualiser sur la carte"
        onClick={() => setIsMapOpened(true)}
        priority="tertiary"
        size="small"
        iconId="fr-icon-road-map-line"
        className={fr.cx("fr-ml-auto")}
        type="button"
      >
        Visualiser sur la carte
      </Button>
      {createPortal(mapJsx, document.body)}
    </>
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
20;
