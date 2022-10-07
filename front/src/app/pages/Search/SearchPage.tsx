import distanceSearchIcon from "/img/distance-search-icon.svg";
import locationSearchIcon from "/img/location-search-icon.svg";
import sortSearchIcon from "/sort-search-icon.svg";
import SearchIcon from "@mui/icons-material/Search";
import { Form, Formik } from "formik";
import React from "react";
import { ButtonSearch, MainWrapper } from "react-design-system/immersionFacile";
import { RomeAutocomplete } from "src/app/components/RomeAutocomplete";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import { SearchInput, useSearchUseCase } from "src/hooks/search.hooks";
import { AddressAutocomplete } from "src/uiComponents/autocomplete/AddressAutocomplete";
import { HomeImmersionHowTo } from "src/uiComponents/ImmersionHowTo";
import { StaticDropdown } from "./Dropdown/StaticDropdown";
import { OurAdvises } from "./OurAdvises";
import "./SearchPage.css";
import { SearchResultPanel } from "./SearchResultPanel";
import { addressDtoToString } from "shared";
import { prop } from "ramda";
import { SearchSortedBy } from "shared";

const radiusOptions = [1, 2, 5, 10, 20, 50, 100];
const sortedByOptions: { value: SearchSortedBy; label: string }[] = [
  { value: "distance", label: "Par proximité" },
  { value: "date", label: "Par date de publication" },
];
const initiallySelectedIndex = -1; // don't select anything initially

export const SearchPage = () => {
  const searchStatus = useAppSelector(searchSelectors.searchStatus);
  const searchUseCase = useSearchUseCase();

  return (
    <HeaderFooterLayout>
      <MainWrapper vSpacing={0}>
        <div className="sm:flex sm:items-center bg-gradient-to-b from-immersionRed-dark to-immersionRed-light">
          <div className="h-[672px] flex-1 flex flex-col items-center fr-p-2w fr-px-2w">
            <h1 className="text-2xl text-white text-center font-bold fr-my-4w fr-px-6w">
              Je trouve une entreprise pour réaliser mon immersion
              professionnelle
            </h1>
            <Formik<SearchInput>
              initialValues={{
                lat: 0,
                lon: 0,
                radiusKm: 10,
                address: "",
                sortedBy: undefined,
              }}
              onSubmit={searchUseCase}
            >
              {({ setFieldValue, values }) => (
                <Form className={"search-page__form"}>
                  <div className="gap-5 flex flex-col">
                    <div>
                      <RomeAutocomplete
                        title="Je recherche un métier"
                        setFormValue={(newValue) =>
                          setFieldValue("rome", newValue.romeCode)
                        }
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
                        setFormValue={({ position, address }) => {
                          setFieldValue("lat", position.lat);
                          setFieldValue("lon", position.lon);
                          setFieldValue("address", addressDtoToString(address));
                        }}
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
                            "radiusKm",
                            radiusOptions[selectedIndex],
                          );
                        }}
                        defaultSelectedIndex={initiallySelectedIndex}
                        options={radiusOptions.map((n) => `${n} km`)}
                        placeholder={"Votre distance (de 1 à 100km)"}
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
                        }}
                        defaultSelectedIndex={initiallySelectedIndex}
                        options={sortedByOptions.map(prop("label"))}
                      />
                    </div>
                    <ButtonSearch
                      disabled={
                        searchStatus === "initialFetch" ||
                        searchStatus === "extraFetch" ||
                        values.lon === 0 ||
                        values.lat === 0
                      }
                      type="submit"
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
