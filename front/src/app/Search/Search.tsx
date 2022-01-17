import { CircularProgress } from "@mui/material";
import { Form, Formik, FormikHelpers } from "formik";
import React, { ReactNode, useState } from "react";
import { immersionSearchGateway } from "src/app/dependencies";
import { ProfessionAutocomplete } from "src/app/Profession/ProfessionAutocomplete";
import {
  ContactEstablishmentModal,
  useContactEstablishmentModal,
} from "src/app/Search/ContactEstablishmentModal";
import distanceSearchIcon from "src/assets/distance-search-icon.svg";
import locationSearchIcon from "src/assets/location-search-icon.svg";
import searchButtonIcon from "src/assets/search-button-icon.svg";
import { AddressAutocomplete } from "src/components/AddressAutocomplete";
import { Layout } from "src/components/Layout";
import { SuccessFeedback } from "src/components/SuccessFeedback";
import { ContactMethod } from "src/shared/FormEstablishmentDto";
import { SearchImmersionResultDto } from "src/shared/SearchImmersionDto";
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
const initialySelectedIndex = 3; // to get 10 km radius by default

const getFeedBackMessage = (contactMethod?: ContactMethod) => {
  switch (contactMethod) {
    case "EMAIL":
      return "L'entreprise a été contactée avec succès.";
    case "PHONE":
    case "IN_PERSON":
      return "Un email vient de vous être envoyé.";
    default:
      return null;
  }
};

export const Search = () => {
  const [result, setResult] = useState<SearchImmersionResultDto[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  return (
    <Layout>
      <div className="sm:flex sm:items-center redGradiant">
        <div className="mainContainer flex-1">
          <h1 className="headerText">
            Trouvez une entreprise accueillante pour réaliser une immersion
            facile
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
              setIsSearching(true);
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
                  console.error(e.toString());
                })
                .finally(() => {
                  setIsSearching(false);
                  setSubmitting(false);
                });
            }}
          >
            {({ setFieldValue }) => (
              <Form>
                <div className="formContentsContainer">
                  <div>
                    <ProfessionAutocomplete
                      title="Métier recherché"
                      setFormValue={(newValue) =>
                        setFieldValue("rome", newValue.romeCodeMetier)
                      }
                      className="searchdropdown-header inputLabel"
                    />
                  </div>

                  <div>
                    <AddressAutocomplete
                      label="Lieu"
                      headerClassName="searchdropdown-header inputLabel"
                      inputStyle={{
                        paddingLeft: "48px",
                        background: `white url(${locationSearchIcon}) no-repeat scroll 11px 8px`,
                      }}
                      setFormValue={({ coordinates }) => {
                        setFieldValue("lat", coordinates.lat);
                        setFieldValue("lon", coordinates.lon);
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
                      onSelection={(
                        newValue: string,
                        selectedIndex: number,
                      ) => {
                        setFieldValue("radiusKm", radiusOptions[selectedIndex]);
                      }}
                      defaultSelectedIndex={initialySelectedIndex}
                      options={radiusOptions.map((n) => `${n} km`)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="searchButton"
                    disabled={isSearching}
                  >
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
        <div className="searchResultContainer sm:flex-1 sm:overflow-y-scroll">
          <SearchResultPanel searchResults={result} isSearching={isSearching} />
        </div>
      </div>
    </Layout>
  );
};

type SearchResultsProps = {
  searchResults: SearchImmersionResultDto[] | null;
  isSearching: boolean;
};

export const SearchResultPanel = ({
  searchResults,
  isSearching,
}: SearchResultsProps) => {
  // prettier-ignore
  const [successfulValidationMessage, setSuccessfulValidatedMessage] = useState<string | null>(null);
  const [successFullyValidated, setSuccessfullyValidated] = useState(false);
  const { modalState, dispatch } = useContactEstablishmentModal();

  if (isSearching)
    return (
      <SearchInfos>
        <CircularProgress color="inherit" size="75px" />
      </SearchInfos>
    );

  if (searchResults === null)
    return <SearchInfos>Veuillez sélectionner vos critères</SearchInfos>;

  if (searchResults.length === 0)
    return (
      <SearchInfos>
        Pas de résultat. Essayez avec un plus grand rayon de recherche...
      </SearchInfos>
    );

  return (
    <>
      {searchResults.map((r) => {
        const distanceKm = ((r.distance_m ?? 0) / 1000).toFixed(1);

        return (
          <EnterpriseSearchResult
            key={r.id}
            title={r.name}
            radius={`${distanceKm} km`}
            address={r.address}
            siret={r.siret}
            contactMode={r.contactMode}
            onButtonClick={() =>
              dispatch({
                type: "CLICKED_OPEN",
                payload: {
                  immersionOfferId: r.id,
                  contactId: r.contactDetails?.id,
                  contactMethod: r.contactMode,
                },
              })
            }
            disableButton={modalState.isValidating}
          />
        );
      })}
      <ContactEstablishmentModal
        modalState={modalState}
        dispatch={dispatch}
        onSuccess={() => {
          setSuccessfulValidatedMessage(
            getFeedBackMessage(modalState.contactMethod),
          );
          setSuccessfullyValidated(true);
        }}
      />
      {successfulValidationMessage && (
        <SuccessFeedback
          open={successFullyValidated}
          handleClose={() => {
            setSuccessfulValidatedMessage(null);
            setSuccessfullyValidated(false);
          }}
        >
          {successfulValidationMessage}
        </SuccessFeedback>
      )}
    </>
  );
};

type SearchInfosProps = {
  children: ReactNode;
};

const SearchInfos = ({ children }: SearchInfosProps) => (
  <div className="text-white sm:h-full text-2xl font-semibold flex justify-center items-center pb-16">
    <div>{children}</div>
  </div>
);
