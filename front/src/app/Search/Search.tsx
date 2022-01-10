import { Form, Formik, FormikHelpers } from "formik";
import React, { useState } from "react";
import { immersionSearchGateway } from "src/app/dependencies";
import { ProfessionAutocomplete } from "src/app/FormEstablishment/ProfessionAutocomplete";
import {
  ContactEstablishmentModal,
  useContactEstablishmentModal,
} from "src/app/Search/ContactEstablishmentModal";
import distanceSearchIcon from "src/assets/distance-search-icon.svg";
import locationSearchIcon from "src/assets/location-search-icon.svg";
import searchButtonIcon from "src/assets/search-button-icon.svg";
import { AddressAutocomplete } from "src/components/AddressAutocomplete";
import { MarianneHeader } from "src/components/MarianneHeader";
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
  const [successFullyValidated, setSuccessfullyValidated] = useState(false);
  const [successfulValidationMessage, setSuccessfulValidatedMessage] = useState<
    string | null
  >(null);
  const { modalState, dispatch } = useContactEstablishmentModal();

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
                console.error(e.toString());
              })
              .finally(() => {
                setSubmitting(false);
              });
          }}
        >
          {({ setFieldValue, values }) => (
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
        {result !== null &&
          (result.length === 0 ? (
            <p className="p-5">
              Pas de résultat. Essayez avec un plus grand rayon de recherche...
            </p>
          ) : (
            result.map((r) => {
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
            })
          ))}
      </div>

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
    </div>
  );
};
