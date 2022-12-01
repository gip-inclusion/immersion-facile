import distanceSearchIcon from "/img/distance-search-icon.svg";
import locationSearchIcon from "/img/location-search-icon.svg";
import sortSearchIcon from "/sort-search-icon.svg";
import SearchIcon from "@mui/icons-material/Search";
import { Form, Formik } from "formik";
import React, { useEffect, useState } from "react";
import { ButtonSearch, MainWrapper } from "react-design-system/immersionFacile";
import { RomeAutocomplete } from "src/app/components/RomeAutocomplete";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/hooks/reduxHooks";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import { useSearchUseCase } from "src/hooks/search.hooks";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { HomeImmersionHowTo } from "src/app/components/ImmersionHowTo";
import { StaticDropdown } from "src/app/components/search/Dropdown/StaticDropdown";
import { OurAdvises } from "src/app/components/search/OurAdvises";
import "./SearchPage.css";
import { SearchResultPanel } from "src/app/components/search/SearchResultPanel";
import { addressDtoToString } from "shared";
import { prop } from "ramda";
import { SearchSortedBy } from "shared";
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
const initiallySelectedIndex = -1;

export const SearchPage = ({
  route,
}: {
  route: Route<typeof routes.search>;
}) => {
  const searchStatus = useAppSelector(searchSelectors.searchStatus);
  const searchUseCase = useSearchUseCase();
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
        <div className="sm:flex sm:items-center bg-immersionGreen-dark">
          <div className="h-[672px] flex-1 flex flex-col items-center fr-p-2w fr-px-2w">
            <h1 className="text-2xl text-white text-center font-bold fr-my-4w fr-px-6w">
              Je trouve une entreprise pour réaliser mon immersion
              professionnelle
            </h1>
            <Formik<SearchPageParams>
              initialValues={formikValues}
              onSubmit={searchUseCase}
              enableReinitialize={availableForSearchRequest(
                searchStatus,
                route.params as SearchPageParams,
              )}
            >
              {({ setFieldValue, values }) => (
                <Form className={"search-page__form"}>
                  <div className="gap-5 flex flex-col">
                    <div>
                      <RomeAutocomplete
                        title="Je recherche un métier"
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
                        tooltip="Je laisse ce champ vide si je veux voir toutes les entreprises autour de moi"
                      />
                    </div>

                    <div>
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
                        notice={"Saisissez un code postal et/ou une ville"}
                      />
                      <StaticDropdown
                        inputStyle={{
                          paddingLeft: "48px",
                          background: `white url(${distanceSearchIcon}) no-repeat scroll 11px 8px`,
                        }}
                        title=""
                        onSelection={(
                          _newValue: string,
                          selectedIndex: number,
                        ) => {
                          setFieldValue(
                            "distance_km",
                            radiusOptions[selectedIndex],
                          );
                          setFormikValues({
                            ...values,
                            distance_km: radiusOptions[selectedIndex],
                          });
                        }}
                        defaultSelectedIndex={
                          values.distance_km && values.distance_km > 0
                            ? radiusOptions.indexOf(values.distance_km)
                            : initiallySelectedIndex
                        }
                        options={radiusOptions.map((n) => `${n} km`)}
                        placeholder={"Votre distance (de 1 à 100km)"}
                        id="im-search-page__distance-dropdown"
                      />
                      <StaticDropdown
                        inputStyle={{
                          paddingLeft: "48px",
                          background: `white url(${sortSearchIcon}) no-repeat scroll 11px 8px`,
                          backgroundSize: "22px auto",
                        }}
                        title="Mon critère de tri"
                        placeholder={`Ex : ${sortedByOptions[0].label}`}
                        onSelection={(
                          _newValue: string,
                          selectedIndex: number,
                        ) => {
                          setFieldValue(
                            "sortedBy",
                            sortedByOptions[selectedIndex]?.value,
                          );
                          setFormikValues({
                            ...values,
                            sortedBy: sortedByOptions[selectedIndex]?.value,
                          });
                        }}
                        defaultSelectedIndex={sortedByOptions.findIndex(
                          (option) => option.value === values?.sortedBy,
                        )}
                        options={sortedByOptions.map(prop("label"))}
                        id="im-search-page__sort-dropdown"
                      />
                    </div>
                    <ButtonSearch
                      disabled={
                        !availableForSearchRequest(searchStatus, values)
                      }
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
          </div>
          <div className="flex flex-col items-center sm:h-[670px] sm:flex-1 sm:overflow-y-scroll">
            <SearchResultPanel />
          </div>
        </div>
        <div>
          <OurAdvises />
          <HomeImmersionHowTo />
        </div>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
