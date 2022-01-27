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
import { AddressAutocomplete } from "src/components/AddressAutocomplete";
import { Layout } from "src/components/Layout";
import { SearchButton } from "src/components/SearchButton";
import { SuccessFeedback } from "src/components/SuccessFeedback";
import { ContactMethod } from "src/shared/FormEstablishmentDto";
import {
  SearchImmersionRequestDto,
  SearchImmersionResultDto,
} from "src/shared/SearchImmersionDto";
import { StaticDropdown } from "./Dropdown/StaticDropdown";
import { EnterpriseSearchResult } from "./EnterpriseSearchResult";
import SearchIcon from "@mui/icons-material/Search";

interface Values {
  rome?: string;
  nafDivision?: string;
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
      <div className="sm:flex sm:items-center bg-gradient-to-b from-immersionRed-dark to-immersionRed-light">
        <div className="h-[672px] flex-1 flex flex-col items-center p-10">
          <h1 className="text-2xl text-white text-center font-bold">
            Trouvez une entreprise accueillante pour réaliser une immersion
            facile
          </h1>
          <span style={{ height: "30px" }} />
          <Formik
            initialValues={{
              lat: 0,
              lon: 0,
              radiusKm: 10,
            }}
            onSubmit={async (
              values,
              { setSubmitting }: FormikHelpers<Values>,
            ) => {
              setIsSearching(true);
              const searchImmersionRequestDto: SearchImmersionRequestDto = {
                rome: values.rome || undefined,
                location: {
                  lat: values.lat,
                  lon: values.lon,
                },
                distance_km: values.radiusKm,
                nafDivision: values.nafDivision,
              };
              immersionSearchGateway
                .search(searchImmersionRequestDto)
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
                <div className="gap-5 flex flex-col">
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
                  <SearchButton
                    className="mt-12"
                    dark
                    disabled={isSearching}
                    type="submit"
                  >
                    <SearchIcon />
                    <div>Rechercher</div>
                  </SearchButton>
                </div>
              </Form>
            )}
          </Formik>
        </div>
        <div className="flex flex-col items-center sm:h-[670px] sm:flex-1 sm:overflow-y-scroll">
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
      {searchResults.map((searchResult) => (
        <EnterpriseSearchResult
          key={searchResult.id}
          searchResult={searchResult}
          onButtonClick={() =>
            dispatch({
              type: "CLICKED_OPEN",
              payload: {
                immersionOfferId: searchResult.id,
                contactId: searchResult.contactDetails?.id,
                contactMethod: searchResult.contactMode,
              },
            })
          }
          disableButton={modalState.isValidating}
        />
      ))}
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
