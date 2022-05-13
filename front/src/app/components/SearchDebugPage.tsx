import { Field, Form, Formik, FormikHelpers } from "formik";
import React, { useState } from "react";
import { firstValueFrom } from "rxjs";
import { immersionSearchGateway } from "src/app/config/dependencies";
import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";
import { AddressAutocomplete } from "src/uiComponents/AddressAutocomplete";
import { AppellationAutocomplete } from "./AppellationAutocomplete";

interface Values {
  rome: string;
  nafDivision: string;
  lat: number;
  lon: number;
  radius: number;
}

export const SearchDebugPage = () => {
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
        onSubmit={
          //eslint-disable-next-line @typescript-eslint/require-await
          async (values, { setSubmitting }: FormikHelpers<Values>) => {
            setLatency(0);
            const requestDate = new Date();
            firstValueFrom(
              immersionSearchGateway.search({
                rome: values.rome,
                location: {
                  lat: values.lat,
                  lon: values.lon,
                },
                distance_km: values.radius,
                sortedBy: "distance",
              }),
            )
              .then((response) => {
                setResponseText(JSON.stringify(response));
                setResult(response);
              })
              .catch((e) => {
                setResponseText(e.toString());
              })
              .finally(() => {
                const responseDate = new Date();
                setLatency(responseDate.getTime() - requestDate.getTime());
                setSubmitting(false);
              });
          }
        }
      >
        {({ setFieldValue }) => (
          <Form>
            <label htmlFor="rome">Rome</label>
            <Field id="rome" name="rome" placeholder="M1607" />
            <AppellationAutocomplete
              title="Rechercher un métier (ou saissir son code ci-dessus)"
              setFormValue={(newValue: AppellationDto) => {
                setFieldValue("rome", newValue.romeCode);
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
