import distanceSearchIcon from "/distance-search-icon.svg";
import locationSearchIcon from "/location-search-icon.svg";
import SearchIcon from "@mui/icons-material/Search";
import { Form, Formik } from "formik";
import React from "react";
import { RomeAutocomplete } from "src/app/components/RomeAutocomplete";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { SearchInput, useSearchUseCase } from "src/hooks/search.hooks";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import { HomeImmersionHowTo } from "src/uiComponents/ImmersionHowTo";
import { StaticDropdown } from "./Dropdown/StaticDropdown";
import { OurAdvises } from "./OurAdvises";
import { SearchResultPanel } from "./SearchResultPanel";
import { ButtonSearch, MainWrapper } from "react-design-system/immersionFacile";
import { AddressAutocomplete } from "src/uiComponents/autocomplete/AddressAutocomplete";

const radiusOptions = [1, 2, 5, 10, 20, 50, 100];
const initiallySelectedIndex = -1; // don't select anything initially

export const SearchPage = () => {
  const searchStatus = useAppSelector(searchSelectors.searchStatus);
  const searchUseCase = useSearchUseCase();

  return (
    <HeaderFooterLayout>
      <MainWrapper vSpacing={0}>
        <div className="sm:flex sm:items-center bg-gradient-to-b from-immersionRed-dark to-immersionRed-light">
          <div className="h-[672px] flex-1 flex flex-col items-center fr-p-2w fr-px-6w">
            <h1 className="text-2xl text-white text-center font-bold fr-my-4w">
              Je trouve une entreprise pour réaliser mon immersion
              professionnelle
            </h1>
            <Formik<SearchInput>
              initialValues={{
                lat: 0,
                lon: 0,
                radiusKm: 10,
              }}
              onSubmit={searchUseCase}
            >
              {({ setFieldValue, values }) => (
                <Form>
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
                        setFormValue={({ position }) => {
                          setFieldValue("lat", position.lat);
                          setFieldValue("lon", position.lon);
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
                    </div>
                    <ButtonSearch
                      className="mt-12"
                      dark
                      disabled={
                        searchStatus === "initialFetch" ||
                        searchStatus === "extraFetch" ||
                        values.lon === 0 ||
                        values.lat === 0
                      }
                      type="submit"
                    >
                      <div>
                        <SearchIcon />
                        Rechercher
                      </div>
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
