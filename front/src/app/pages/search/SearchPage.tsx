import React, { useEffect, useRef } from "react";
import { Route } from "type-route";
import { useForm, useWatch } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useStyles } from "tss-react/dsfr";
import { GenericOption, Select } from "@codegouvfr/react-dsfr/Select";
import {
  Loader,
  MainWrapper,
  PageHeader,
  SectionAccordion,
  SectionTextEmbed,
} from "react-design-system";
import { domElementIds, GeoPositionDto, SearchSortedBy } from "shared";
import { AppellationAutocomplete } from "src/app/components/forms/autocomplete/AppellationAutocomplete";
import { PlaceAutocomplete } from "src/app/components/forms/autocomplete/PlaceAutocomplete";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { SearchListResults } from "src/app/components/search/SearchListResults";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useSearchUseCase } from "src/app/hooks/search.hooks";
import { routes } from "src/app/routes/routes";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import {
  SearchPageParams,
  SearchStatus,
} from "src/core-logic/domain/search/search.slice";
import "./SearchPage.scss";
import { keys } from "ramda";

const radiusOptions: GenericOption<number>[] = [1, 2, 5, 10, 20, 50, 100].map(
  (distance) => ({
    label: `${distance} km`,
    value: distance,
  }),
);
const sortedByOptions: { value: SearchSortedBy; label: string }[] = [
  { value: "distance", label: "Par proximité" },
  { value: "date", label: "Par date de publication" },
];
export const SearchPage = ({
  route,
}: {
  route: Route<typeof routes.search>;
}) => {
  const { cx } = useStyles();
  const searchStatus = useAppSelector(searchSelectors.searchStatus);
  const searchResults = useAppSelector(searchSelectors.searchResults);

  const searchUseCase = useSearchUseCase();
  const searchResultsWrapper = useRef<HTMLDivElement>(null);
  const initialValues: SearchPageParams = {
    latitude: 0,
    longitude: 0,
    distance_km: 10,
    place: "",
    sortedBy: "distance",
    appellationCode: undefined,
    appellationLabel: undefined,
    rome: undefined,
    romeLabel: undefined,
  };

  const availableForSearchRequest = (
    searchStatus: SearchStatus,
    { lat, lon }: GeoPositionDto,
  ): boolean => {
    const check =
      searchStatus !== "initialFetch" &&
      searchStatus !== "extraFetch" &&
      lon !== 0 &&
      lat !== 0;
    return !!check;
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
  const { handleSubmit, setValue, register, control, getValues } = methods;
  const formValues = getValues();
  const [lat, lon] = useWatch({
    control,
    name: ["latitude", "longitude"],
  });

  const getSearchResultsSummary = (resultsNumber: number) => {
    const plural = resultsNumber > 1 ? "s" : "";
    return (
      <>
        <strong>{resultsNumber}</strong> résultat{plural} trouvé{plural}
      </>
    );
  };

  useEffect(() => {
    if (availableForSearchRequest(searchStatus, { lat, lon })) {
      searchUseCase(filterFormValues(formValues));
    }
  }, []);

  return (
    <HeaderFooterLayout>
      <MainWrapper vSpacing={0} layout="fullscreen">
        <PageHeader
          title="Je trouve une entreprise pour réaliser mon immersion professionnelle"
          theme="candidate"
        >
          <form
            onSubmit={handleSubmit((value) =>
              searchUseCase(filterFormValues(value)),
            )}
            className={cx(
              fr.cx("fr-grid-row", "fr-grid-row--gutters"),
              "im-search-page__form",
              "im-search-page__form--v2",
            )}
          >
            <div
              className={cx(
                fr.cx("fr-col-12", "fr-col-lg-4"),
                "im-search-page__form-input-wrapper",
              )}
            >
              <AppellationAutocomplete
                label="Je recherche le métier :"
                initialValue={{
                  romeCode: formValues.rome ?? "",
                  romeLabel: formValues.romeLabel ?? "",
                  appellationLabel: formValues.appellationLabel ?? "",
                  appellationCode: formValues.appellationCode ?? "",
                }}
                setFormValue={(newValue) => {
                  setValue("rome", newValue.romeCode);
                  setValue("romeLabel", newValue.romeLabel);
                  setValue("appellationCode", newValue.appellationCode);
                  setValue("appellationLabel", newValue.appellationLabel);
                }}
                selectedAppellations={[
                  {
                    romeLabel: formValues.romeLabel ?? "",
                    romeCode: formValues.rome ?? "",
                    appellationCode: formValues.appellationCode ?? "",
                    appellationLabel: formValues.appellationLabel ?? "",
                  },
                ]}
                id={domElementIds.search.appellationAutocomplete}
              />
            </div>
            <div
              className={cx(
                fr.cx("fr-col-12", "fr-col-lg-4"),
                "im-search-page__form-input-wrapper",
              )}
            >
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
            <div
              className={cx(
                fr.cx("fr-col-12", "fr-col-lg-2"),
                "im-search-page__form-input-wrapper",
              )}
            >
              <Select
                label="Distance maximum"
                placeholder="Distance"
                options={radiusOptions}
                nativeSelectProps={{
                  ...register("distance_km"),
                  id: domElementIds.search.distanceSelect,
                }}
              />
            </div>

            <div
              className={cx(
                fr.cx("fr-col-12", "fr-col-lg-2"),
                "im-search-page__form-input-wrapper",
              )}
            >
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
        <div className={fr.cx("fr-pt-6w")} ref={searchResultsWrapper}>
          {searchStatus === "ok" && (
            <>
              <div className={fr.cx("fr-container")}>
                <div
                  className={fr.cx(
                    "fr-grid-row",
                    "fr-grid-row--gutters",
                    "fr-mb-4w",
                  )}
                >
                  <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
                    <fieldset
                      className={fr.cx(
                        "fr-fieldset",
                        "fr-fieldset--inline",
                        "fr-mb-0",
                      )}
                    >
                      <legend
                        className={fr.cx(
                          "fr-fieldset__legend",
                          "fr-text--regular",
                        )}
                        id={domElementIds.search.sortFilter}
                      >
                        Trier les résultats :
                      </legend>
                      <div className={fr.cx("fr-fieldset__content")}>
                        {sortedByOptions.map((option, index) => (
                          <div
                            className={fr.cx("fr-radio-group")}
                            key={`${domElementIds.search.searchSortOptionBase}${index}`}
                          >
                            <input
                              type="radio"
                              id={`${domElementIds.search.searchSortOptionBase}${index}`}
                              name="search-sort-option"
                              value={option.value}
                              checked={routeParams.sortedBy === option.value}
                              onChange={() => {
                                searchUseCase({
                                  ...formValues,
                                  sortedBy: option.value,
                                });
                              }}
                            />
                            <label
                              className={fr.cx("fr-label")}
                              htmlFor={`${domElementIds.search.searchSortOptionBase}${index}`}
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                  <div
                    className={cx(
                      fr.cx(
                        "fr-col-12",
                        "fr-col-md-4",
                        "fr-grid-row",
                        "fr-grid-row--right",
                      ),
                      "im-search-page__results-summary",
                    )}
                  >
                    {searchStatus === "ok" && (
                      <>
                        <h2 className={fr.cx("fr-h5", "fr-mb-0")}>
                          {getSearchResultsSummary(searchResults.length)}
                        </h2>
                        {routeParams.rome && routeParams.romeLabel && (
                          <span
                            className={cx(
                              fr.cx("fr-text--xs"),
                              "im-search-page__results-summary-description",
                            )}
                          >
                            pour la recherche{" "}
                            <strong className={fr.cx("fr-text--bold")}>
                              {routeParams.appellationLabel}
                            </strong>
                            , étendue au secteur{" "}
                            <a
                              href={`https://candidat.pole-emploi.fr/marche-du-travail/fichemetierrome?codeRome=${routeParams.rome}`}
                              target="_blank"
                              className={fr.cx("fr-text--bold")}
                            >
                              {routeParams.romeLabel}
                            </a>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <SearchListResults />
            </>
          )}
          {searchStatus === "extraFetch" ||
            (searchStatus === "initialFetch" && <Loader />)}

          <SectionAccordion />
          <SectionTextEmbed
            videoUrl=" https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise.mp4"
            videoPosterUrl="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_poster.webp"
            videoDescription="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_transcript.vtt"
            videoTranscription="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_transcript.txt"
          />
        </div>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
