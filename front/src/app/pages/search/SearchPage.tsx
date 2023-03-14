import { Form, Formik } from "formik";
import React, { useEffect, useRef, useState } from "react";
import {
  MainWrapper,
  PageHeader,
  SectionTextEmbed,
  SectionAccordion,
  Loader,
} from "react-design-system";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import { useSearchUseCase } from "src/app/hooks/search.hooks";
import "./SearchPage.scss";
import { SearchListResults } from "src/app/components/search/SearchListResults";
import { domElementIds, SearchSortedBy } from "shared";

import {
  SearchPageParams,
  SearchStatus,
} from "src/core-logic/domain/search/search.slice";
import { Route } from "type-route";
import { routes } from "src/app/routes/routes";
import { PlaceAutocomplete } from "src/app/components/forms/autocomplete/PlaceAutocomplete";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import { AppellationAutocomplete } from "src/app/components/forms/autocomplete/AppellationAutocomplete";
import { Button } from "@codegouvfr/react-dsfr/Button";

const radiusOptions = [1, 2, 5, 10, 20, 50, 100];
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
    sortedBy: undefined,
  };
  const [formikValues, setFormikValues] =
    useState<SearchPageParams>(initialValues);

  const availableForSearchRequest = (
    searchStatus: SearchStatus,
    values: SearchPageParams,
  ): boolean => {
    const check =
      searchStatus !== "initialFetch" &&
      searchStatus !== "extraFetch" &&
      values.longitude &&
      values.latitude &&
      values.longitude !== 0 &&
      values.latitude !== 0;
    return !!check;
  };

  useEffect(() => {
    if (
      route &&
      availableForSearchRequest(searchStatus, route.params as SearchPageParams)
    ) {
      setFormikValues(route.params as SearchPageParams);
      searchUseCase(route.params as SearchPageParams);
    }
  }, []);
  return (
    <HeaderFooterLayout>
      <MainWrapper vSpacing={0} layout="fullscreen">
        <PageHeader
          title="Je trouve une entreprise pour réaliser mon immersion professionnelle"
          theme="candidate"
        >
          <Formik<SearchPageParams>
            initialValues={formikValues}
            onSubmit={searchUseCase}
            enableReinitialize={availableForSearchRequest(
              searchStatus,
              route.params as SearchPageParams,
            )}
          >
            {({ setFieldValue, values }) => (
              <Form
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
                      romeCode: route.params.rome ?? "",
                      romeLabel: route.params.romeLabel ?? "",
                      appellationLabel: route.params.appellationLabel ?? "",
                      appellationCode: route.params.appellationCode ?? "",
                    }}
                    setFormValue={(newValue) => {
                      const newAppellationValue = {
                        romeLabel: newValue.romeLabel,
                        rome: newValue.romeCode,
                        appellationLabel: newValue.appellationLabel,
                        appellationCode: newValue.appellationCode,
                      };
                      setFieldValue("rome", newAppellationValue.rome);
                      setFieldValue("romeLabel", newAppellationValue.romeLabel);
                      setFieldValue(
                        "appellationCode",
                        newAppellationValue.appellationCode,
                      );
                      setFieldValue(
                        "appellationLabel",
                        newAppellationValue.appellationLabel,
                      );
                      setFormikValues({
                        ...values,
                        ...newAppellationValue,
                      });
                    }}
                    selectedAppellations={[
                      {
                        romeLabel: values.romeLabel ?? "",
                        romeCode: values.rome ?? "",
                        appellationCode: values.appellationCode ?? "",
                        appellationLabel: values.appellationLabel ?? "",
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
                    initialInputValue={formikValues.place}
                    onValueChange={(lookupSearchResult) => {
                      if (!lookupSearchResult) return;
                      const { position, label } = lookupSearchResult;
                      setFieldValue("latitude", position.lat);
                      setFieldValue("longitude", position.lon);
                      setFieldValue("place", label);
                      setFormikValues({
                        ...values,
                        latitude: position.lat,
                        longitude: position.lon,
                        place: label,
                      });
                    }}
                    id={domElementIds.search.placeAutocompleteInput}
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
                    options={[
                      {
                        label: "Distance",
                        value: undefined,
                        disabled: true,
                      },
                      ...radiusOptions.map((n, index) => ({
                        label: `${n} km`,
                        value: index,
                      })),
                    ]}
                    nativeSelectProps={{
                      id: domElementIds.search.distanceSelect,
                      onChange: (event: React.ChangeEvent) => {
                        //_newValue: string, selectedIndex: number
                        const selectedIndex =
                          (event.currentTarget as HTMLSelectElement)
                            .selectedIndex - 1;
                        setFieldValue(
                          "distance_km",
                          radiusOptions[selectedIndex],
                        );
                        setFormikValues({
                          ...values,
                          distance_km: radiusOptions[selectedIndex],
                        });
                      },
                      value: radiusOptions.findIndex(
                        (option) => option === values.distance_km,
                      ),
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
                    disabled={!availableForSearchRequest(searchStatus, values)}
                    type="submit"
                    nativeButtonProps={{
                      id: domElementIds.search.searchSubmitButton,
                    }}
                  >
                    Rechercher
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
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
                              checked={formikValues.sortedBy === option.value}
                              onChange={(_event) => {
                                const selectedIndex = index;
                                const newFormikValues = {
                                  ...formikValues,
                                  sortedBy:
                                    sortedByOptions[selectedIndex]?.value,
                                };
                                setFormikValues(newFormikValues);
                                searchUseCase(newFormikValues);
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
                          <strong>{searchResults.length}</strong> résultats
                          trouvés
                        </h2>
                        {route.params.rome && route.params.romeLabel && (
                          <span
                            className={cx(
                              fr.cx("fr-text--xs"),
                              "im-search-page__results-summary-description",
                            )}
                          >
                            pour la recherche{" "}
                            <strong className={fr.cx("fr-text--bold")}>
                              {route.params.appellationLabel}
                            </strong>
                            , étendue au secteur{" "}
                            <a
                              href={`https://candidat.pole-emploi.fr/marche-du-travail/fichemetierrome?codeRome=${route.params.rome}`}
                              target="_blank"
                              className={fr.cx("fr-text--bold")}
                            >
                              {route.params.romeLabel}
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
