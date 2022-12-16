import locationSearchIcon from "/img/location-search-icon.svg";
import SearchIcon from "@mui/icons-material/Search";
import { Form, Formik } from "formik";
import React, { useEffect, useState } from "react";
import {
  ButtonSearch,
  MainWrapper,
  PageHeader,
  SectionTextEmbed,
  Select,
} from "react-design-system/immersionFacile";
import { RomeAutocomplete } from "src/app/components/forms/autocomplete/RomeAutocomplete";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import { useFullSearchUseCase } from "src/app/hooks/search.hooks";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { OurAdvises } from "src/app/components/search/OurAdvises";
import "./SearchListPage.scss";
import { SearchListResults } from "src/app/components/search/SearchListResults";
import { addressDtoToString, SearchSortedBy } from "shared";
// import { SearchSortedBy } from "shared";
import {
  SearchPageParams,
  SearchStatus,
} from "src/core-logic/domain/search/search.slice";
import { Route } from "type-route";
import { routes } from "src/app/routes/routes";

const radiusOptions = [1, 2, 5, 10, 20, 50, 100];
const sortedByOptions: { value: SearchSortedBy; label: string }[] = [
  { value: "distance", label: "Par proximité" },
  { value: "date", label: "Par date de publication" },
];
export const SearchListPage = ({
  route,
}: {
  route: Route<typeof routes.searchV2>;
}) => {
  const searchStatus = useAppSelector(searchSelectors.searchStatus);
  const searchResults = useAppSelector(searchSelectors.searchResults);
  const searchUseCase = useFullSearchUseCase();
  const initialValues = {
    latitude: 0,
    longitude: 0,
    distance_km: 10,
    address: "",
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
        <PageHeader title="Je trouve une entreprise pour réaliser mon immersion professionnelle">
          <Formik<SearchPageParams>
            initialValues={formikValues}
            onSubmit={searchUseCase}
            enableReinitialize={availableForSearchRequest(
              searchStatus,
              route.params as SearchPageParams,
            )}
          >
            {({ setFieldValue, values }) => (
              <Form className={"search-page__form search-page__form--v2"}>
                <div className={"search-page__form-input-wrapper"}>
                  <RomeAutocomplete
                    title="Mon périmètre de recherche"
                    setFormValue={(newValue) => {
                      setFieldValue("romeLabel", newValue.romeLabel);
                      setFieldValue("rome", newValue.romeCode);
                      setFormikValues({
                        ...values,
                        romeLabel: newValue.romeLabel,
                        rome: newValue.romeCode,
                      });
                    }}
                    id={"im-search-page__rome-autocomplete"}
                    initialValue={{
                      romeLabel: values.romeLabel ?? "",
                      romeCode: values.rome ?? "",
                    }}
                    placeholder={"Ex : boulangère, infirmier"}
                    className="searchdropdown-header inputLabel"
                  />
                </div>
                <div className={"search-page__form-input-wrapper"}>
                  <AddressAutocomplete
                    label="Mon périmètre de recherche"
                    headerClassName="searchdropdown-header inputLabel"
                    inputStyle={{
                      paddingLeft: "48px",
                      background: `white url(${locationSearchIcon}) no-repeat scroll 11px 8px`,
                    }}
                    initialSearchTerm={values.address}
                    setFormValue={({ position, address }) => {
                      setFieldValue("latitude", position.lat);
                      setFieldValue("longitude", position.lon);
                      setFieldValue("address", addressDtoToString(address));
                      setFormikValues(values);
                      setFormikValues({
                        ...values,
                        latitude: position.lat,
                        longitude: position.lon,
                        address: addressDtoToString(address),
                      });
                    }}
                    id="im-search-page__address-autocomplete"
                    placeholder={"Ex : Bordeaux 33000"}
                  />
                </div>
                <div
                  className={
                    "search-page__form-input-wrapper search-page__form-input-wrapper--min"
                  }
                >
                  <Select
                    label="Distance maximum"
                    onChange={(event: React.ChangeEvent) => {
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
                    }}
                    options={[
                      {
                        label: "Distance",
                        value: undefined,
                        disabled: true,
                        selected: true,
                      },
                      ...radiusOptions.map((n, index) => ({
                        label: `${n} km`,
                        value: index,
                      })),
                    ]}
                    id="im-search-page__distance-dropdown"
                  />
                </div>

                <div
                  className={
                    "search-page__form-input-wrapper search-page__form-input-wrapper--min"
                  }
                >
                  <ButtonSearch
                    disabled={!availableForSearchRequest(searchStatus, values)}
                    type="submit"
                    id={"im-search__submit-search"}
                  >
                    <span>
                      <SearchIcon />
                      Rechercher
                    </span>
                  </ButtonSearch>
                </div>
              </Form>
            )}
          </Formik>
        </PageHeader>
        <div className="fr-pt-6w">
          {searchStatus === "ok" && (
            <>
              <div className="fr-container">
                <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w fr-grid-row--bottom">
                  <div className="fr-col-12 fr-col-md-2">
                    <Select
                      label="Filtrer les résultats par :"
                      id="filter"
                      options={sortedByOptions}
                      onChange={(event) => {
                        const selectedIndex = event.currentTarget.selectedIndex;
                        setFormikValues({
                          ...formikValues,
                          sortedBy: sortedByOptions[selectedIndex]?.value,
                        });
                        searchUseCase(formikValues);
                      }}
                    />
                  </div>
                  <div className="fr-col-12 fr-col-md-4 fr-col-offset-md-6 fr-grid-row fr-grid-row--right">
                    {searchStatus === "ok" && (
                      <span>
                        <strong>{searchResults.length}</strong> résultats
                        trouvés
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <SearchListResults />
            </>
          )}
          {searchStatus === "extraFetch" ||
            (searchStatus === "initialFetch" && (
              <div className="fr-container fr-mb-4w">
                <span>Chargement...</span>
              </div>
            ))}

          <OurAdvises />
          <SectionTextEmbed
            videoUrl=" https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise.mp4"
            videoPosterUrl="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_poster.webp"
          />
        </div>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
