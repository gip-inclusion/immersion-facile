import { keys } from "ramda";
import { useEffect, useState } from "react";
import {
  ContactEstablishmentByMailDto,
  OmitFromExistingKeys,
  ValueOf,
} from "shared";

const unrelevantDataKeysForContactScope: (keyof ContactEstablishmentByMailDto)[] =
  [
    "locationId",
    "immersionObjective",
    "message",
    "appellationCode",
    "contactMode",
    "siret",
  ] as const;

type ContactTranscientData = OmitFromExistingKeys<
  ContactEstablishmentByMailDto,
  (typeof unrelevantDataKeysForContactScope)[number]
>;

type TranscientData = {
  "contact-establishment": ContactTranscientData;
};

type PreferTranscientData = Record<keyof TranscientData, boolean>;

const filterData = (data: ValueOf<TranscientData>) => {
  return keys(data).reduce((acc, key) => {
    if (!unrelevantDataKeysForContactScope.includes(key)) {
      acc[key] = data[key];
    }
    return acc;
  }, {} as ContactTranscientData);
};

export const useTranscientDataFromStorage = (scope: keyof TranscientData) => {
  const dataInStorage = localStorage.getItem(scope);
  const preferUseTranscientDataInStorage = localStorage.getItem(
    "preferUseTranscientData",
  );
  const [transcientData, setTranscientData] = useState<TranscientData | null>(
    dataInStorage ? JSON.parse(dataInStorage) : null,
  );
  const transcientDataForScope = transcientData
    ? filterData(transcientData[scope])
    : null;
  const [preferUseTranscientData, setPreferUseTranscientData] =
    useState<PreferTranscientData>(
      preferUseTranscientDataInStorage
        ? JSON.parse(preferUseTranscientDataInStorage)
        : {
            "contact-establishment": true,
          },
    );

  const setTranscientDataForScope = (data: ValueOf<TranscientData>) => {
    setTranscientData({ ...filterData(data), [scope]: data });
  };

  useEffect(() => {
    if (transcientData) {
      localStorage.setItem(scope, JSON.stringify(transcientData));
    }
    if (preferUseTranscientData) {
      localStorage.setItem(
        "preferUseTranscientData",
        JSON.stringify(preferUseTranscientData),
      );
    }
  }, [transcientData, preferUseTranscientData, scope]);
  return {
    preferUseTranscientData,
    setPreferUseTranscientData,
    transcientData,
    setTranscientData,
    transcientDataForScope,
    setTranscientDataForScope,
  };
};
