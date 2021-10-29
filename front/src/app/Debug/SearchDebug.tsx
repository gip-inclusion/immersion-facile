import React, { useState } from "react";
import { formEstablishmentGateway, immersionSearchGateway } from "../main";
import { Formik, Field, Form, FormikHelpers } from "formik";
import {
  LatLonDto,
  SearchImmersionResponseDto,
} from "src/shared/SearchImmersionDto";
import { DropDown } from "../FormEstablishment/DropDown";
import { ProfessionDto } from "src/shared/rome";

interface Values {
  rome: string;
  nafDivision: string;
  lat: number;
  lon: number;
  radius: number;
}

export const SearchDebug = () => {
  const [result, setResult] = useState<SearchImmersionResponseDto | null>(null);
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

            <DropDown
              title="Rechercher un métier (or enter its code above directly)"
              onSelection={(newValue: ProfessionDto) => {
                console.log(newValue);
                setFieldValue("rome", newValue.romeCodeMetier);
              }}
              onTermChange={async (newTerm) => {
                if (!newTerm) return [];
                const romeOptions =
                  await formEstablishmentGateway.searchProfession(newTerm);

                return romeOptions.map(({ matchRanges, profession }) => ({
                  value: profession,
                  description: profession.description,
                  matchRanges,
                }));
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

            <DropDown
              title="Rechercher un endroit (or enter lat/lon directly above)"
              onSelection={(newValue: LatLonDto) => {
                setFieldValue("lat", newValue.lat);
                setFieldValue("lon", newValue.lon);
              }}
              onTermChange={async (newTerm: string) => {
                if (!newTerm) return [];

                const results = await immersionSearchGateway.addressLookup(
                  newTerm,
                );

                return results.map((result) => ({
                  value: result.coordinates,
                  description: result.label,
                  matchRanges: [],
                }));
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
