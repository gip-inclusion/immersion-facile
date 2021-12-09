import { Field, Form, Formik, FormikHelpers } from "formik";
import React, { useState } from "react";
import { immersionSearchGateway } from "src/app/dependencies";
import { ProfessionAutocomplete } from "src/app/FormEstablishment/ProfessionAutocomplete";
import { AddressAutocomplete } from "src/components/AddressAutocomplete";
import { ProfessionDto } from "src/shared/rome";
import { SearchImmersionResultDto } from "src/shared/SearchImmersionDto";

interface Values {
  rome: string;
  nafDivision: string;
  lat: number;
  lon: number;
  radius: number;
}

export const SearchDebug = () => {
  const [result, setResult] = useState<SearchImmersionResultDto[] | null>(null);
  const [responseText, setResponseText] = useState("");
  const [latency, setLatency] = useState(0);

  return (
    <div>
      <h1>Test Immersion Search API</h1>
      <Formik
        initialValues={{
          rome: "M1607",
          nafDivision: "85",
          lat: 48.8666,
          lon: 2.3333,
          radius: 12,
        }}
        onSubmit={async (values, { setSubmitting }: FormikHelpers<Values>) => {
          setLatency(0);
          let requestDate = new Date();
          immersionSearchGateway
            .search({
              rome: values.rome,
              location: {
                lat: values.lat,
                lon: values.lon,
              },
              distance_km: values.radius,
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
            <label htmlFor="rome">Rome</label>
            <Field id="rome" name="rome" placeholder="M1607" />
            <ProfessionAutocomplete
              title="Rechercher un métier (ou saissir son code ci-dessus)"
              setFormValue={(newValue: ProfessionDto) => {
                setFieldValue("rome", newValue.romeCodeMetier);
              }}
            />
            <br />

            <label htmlFor="nafDivision">Naf division (optional)</label>
            <Field id="nafDivision" name="nafDivision" placeholder="42" />
            <br />

            <label htmlFor="lat">Latitude</label>
            <Field id="lat" name="lat" placeholder="42.123" />
            <label htmlFor="lon">Longitude</label>
            <Field id="lon" name="lon" placeholder="42.123" />
            <label htmlFor="radius">Radius, km</label>
            <Field id="radius" name="radius" type="number" placeholder="30" />
            <AddressAutocomplete
              label="Rechercher un endroit (ou saisir lat/lon ci-dessus)"
              setFormValue={({ coordinates }) => {
                setFieldValue("lat", coordinates.lat);
                setFieldValue("lon", coordinates.lon);
              }}
            />
            <br />

            <button type="submit">Search Immersions</button>
          </Form>
        )}
      </Formik>
      <div>Elapsed time: {latency}ms</div>
      Result count: {result ? result.length : 0}
      <br />
      Result:
      <br /> {responseText}
    </div>
  );
};
