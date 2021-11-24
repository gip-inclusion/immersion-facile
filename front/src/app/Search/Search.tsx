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
import { DropDown } from "../FormEstablishment/DropDown";
import { ProfessionDto } from "src/shared/rome";
import { MarianneHeader } from "src/components/MarianneHeader";

interface Values {
  rome: string;
  nafDivision: string;
  lat: number;
  lon: number;
  radiusKm: number;
}

export const Search = () => {
  const [result, setResult] = useState<SearchImmersionResponseDto | null>(null);
  const [responseText, setResponseText] = useState("");
  const [latency, setLatency] = useState(0);
  const [searchPosition, setSearchPosition] = useState([0, 0]);

  return (
    <div>
      <MarianneHeader />
      <h1>Trouver une immersion en entreprise</h1>
      <div className="fr-container">
        <div className="fr-grid-row">
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
              setLatency(0);
              let requestDate = new Date();
              setSearchPosition([values.lat, values.lon]);

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
                  setResponseText(JSON.stringify(response));
                  setResult(response);
                })
                .catch((e) => {
                  setResponseText(e.toString());
                })
                .finally(() => {
                  let responseDate = new Date();
                  setLatency(responseDate.getTime() - requestDate.getTime());
                  setSubmitting(false);
                });
            }}
          >
            {({ setFieldValue }) => (
              <Form>
                <div className="fr-col">
                  <DropDown
                    title="Rechercher un métier"
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

                <div className="fr-col">
                  <DropDown
                    title="Rechercher un endroit"
                    onSelection={(newValue: LatLonDto) => {
                      setFieldValue("lat", newValue.lat);
                      setFieldValue("lon", newValue.lon);
                    }}
                    onTermChange={async (newTerm: string) => {
                      if (!newTerm) return [];

                      const results =
                        await immersionSearchGateway.addressLookup(newTerm);

                      return results.map((result) => ({
                        value: result.coordinates,
                        description: result.label,
                        matchRanges: [],
                      }));
                    }}
                  />
                </div>

                <div className="fr-row">
                  <div className="fr-col">
                    <label htmlFor="radius">Radius, km</label>
                    <Field
                      id="radius"
                      name="radius"
                      type="number"
                      placeholder="30"
                    />
                  </div>
                  <button type="submit" className="fr-btn">
                    Rechercher Immersions
                  </button>
                </div>
              </Form>
            )}
          </Formik>
          <div className="fr-col"></div>
          <div className="fr-col-4"></div>
          <div className="fr-col-12 fr-col-lg-4"></div>
        </div>
      </div>
      <div>Elapsed time: {latency}ms</div>
      Result count: {result ? result.length : 0}
      <br />
      Result:
      {result &&
        result.map((r: SearchImmersionResultDto) => {
          return (
            <>
              <div
                className="fr-card fr-card--horizontal fr-enlarge-link"
                id={r.id}
              >
                <div className="fr-card__body">
                  <h4 className="fr-card__title">
                    <a
                      href={"mailto:" + r.contact?.email}
                      className="fr-card__link"
                    >
                      {r.name}
                    </a>
                  </h4>
                  <p className="fr-card">{r.address}</p>
                  <p className="fr-card__desc">
                    {r.distance_m && (r.distance_m / 1000).toFixed(1)} km(s) du lieu
                    de recherche{" "}
                  </p>
                </div>
              </div>
            </>
          );
        })}
    </div>
  );
};

// TODO:
// 1. Open a modal with card on click
// 2. Query params
// 3. Fix back to send human-readable ROME stuff
