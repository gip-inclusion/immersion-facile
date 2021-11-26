import React, { useState } from "react";
import {
  formEstablishmentGateway,
  immersionSearchGateway,
} from "src/app/dependencies";
import { Formik, Field, Form, FormikHelpers } from "formik";
import {
  LatLonDto,
  SearchImmersionResponseDto,
  SearchImmersionResultDto,
} from "src/shared/SearchImmersionDto";
import { ProfessionDto } from "src/shared/rome";
import { MarianneHeader } from "src/components/MarianneHeader";
import { SearchDropDown } from "./Dropdown/SearchDropDown";
import locationSearchIcon from "src/assets/location-search-icon.svg";
import distanceSearchIcon from "src/assets/distance-search-icon.svg";
import searchButtonIcon from "src/assets/search-button-icon.svg";
import { StaticDropdown } from "./Dropdown/StaticDropdown";
import "./search.css";
import { EnterpriseSearchResult } from "./SearchResult";

interface Values {
  rome: string;
  nafDivision: string;
  lat: number;
  lon: number;
  radiusKm: number;
}

const radiusOptions = [1, 2, 5, 10, 20, 50, 100];

export const Search = () => {
  const [result, setResult] = useState<SearchImmersionResponseDto | null>(null);

  return (
    <div>
      <MarianneHeader />

      <div className="mainContainer">
        <h1 className="headerText">
          Trouver une entreprise accueillante pour réaliser une immersion facile
        </h1>
        <span style={{ height: "30px" }} />
        <Formik
          initialValues={{
            rome: "M1607",
            nafDivision: "85",
            lat: 48.8666,
            lon: 2.3333,
            radiusKm: 12,
          }}
          onSubmit={async (
            values,
            { setSubmitting }: FormikHelpers<Values>,
          ) => {
            immersionSearchGateway
              .search({
                rome: values.rome,
                location: {
                  lat: values.lat,
                  lon: values.lon,
                },
                distance_km: values.radiusKm,
                nafDivision:
                  values.nafDivision.length === 0
                    ? values.nafDivision
                    : undefined,
              })
              .then((response) => {
                setResult(response);
              })
              .catch((e) => {
                console.log(e.toString());
              })
              .finally(() => {
                setSubmitting(false);
              });
          }}
        >
          {({ setFieldValue }) => (
            <Form>
              <div className="formContentsContainer">
                <div>
                  <SearchDropDown
                    title="Métier recherché"
                    onSelection={(newValue: ProfessionDto) => {
                      console.log(newValue);
                      setFieldValue("rome", newValue.romeCodeMetier);
                    }}
                    onTermChange={async (newTerm) => {
                      if (!newTerm) return [];
                      const romeOptions =
                        await formEstablishmentGateway.searchProfession(
                          newTerm,
                        );

                      return romeOptions.map(({ matchRanges, profession }) => ({
                        value: profession,
                        description: profession.description,
                        matchRanges,
                      }));
                    }}
                  />
                </div>

                <div>
                  <SearchDropDown
                    inputStyle={{
                      paddingLeft: "48px",
                      background: `white url(${locationSearchIcon}) no-repeat scroll 11px 8px`,
                    }}
                    title="Lieu"
                    onSelection={(newValue: LatLonDto) => {
                      setFieldValue("lat", newValue.lat);
                      setFieldValue("lon", newValue.lon);
                    }}
                    onTermChange={async (newTerm: string) => {
                      if (!newTerm) return [];

                      const results =
                        await immersionSearchGateway.addressLookup(newTerm);

                      return results.map((res) => ({
                        value: res.coordinates,
                        description: res.label,
                        matchRanges: [],
                      }));
                    }}
                  />
                </div>

                <div>
                  <StaticDropdown
                    inputStyle={{
                      paddingLeft: "48px",
                      background: `white url(${distanceSearchIcon}) no-repeat scroll 11px 8px`,
                    }}
                    title="Rayon"
                    onSelection={(newValue: string, selectedIndex: number) => {
                      setFieldValue("radiusKm", radiusOptions[selectedIndex]);
                    }}
                    options={radiusOptions.map((n) => `${n} km`)}
                  />
                </div>

                <button type="submit" className="searchButton">
                  <img
                    className="searchButtonImage"
                    src={searchButtonIcon}
                    alt=""
                  />
                  Rechercher
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
      <div className="searchResultContainer">
        {result &&
          result.map((r) => {
            return (
              <EnterpriseSearchResult
                key={r.id}
                title={r.name}
                employeeCount="TODO: count"
                metierDescription="TODO: add rome description"
                radius={`${(r.distance_m ?? 0 / 1000).toFixed(1)} km`}
                address={r.address}
                phone={r.naf ?? r.rome}
                siret={r.siret}
              />
            );
          })}
      </div>
    </div>
  );
};
