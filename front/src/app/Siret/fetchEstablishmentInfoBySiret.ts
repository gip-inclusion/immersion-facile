import type { AxiosError } from "axios";
import { useField } from "formik";
import { useEffect, useState } from "react";
import { immersionApplicationGateway } from "src/app/main";
import type { Establishment } from "src/core-logic/ports/EstablishmentInfoFromSiretApi";
import type { NafDto } from "src/shared/naf";

const addressDictToString = (addressDict: any): string => {
  const addressOrder = [
    "numeroVoieEtablissement",
    "typeVoieEtablissement",
    "libelleVoieEtablissement",
    "codePostalEtablissement",
    "libelleCommuneEtablissement",
  ];
  return addressOrder
    .map((field) => addressDict[field])
    .join(" ")
    .trim();
};

const getBusinessName = (establishment: Establishment) => {
  const uniteLegale = establishment.uniteLegale.denominationUniteLegale;
  if (uniteLegale) return uniteLegale;

  return [
    establishment.uniteLegale.prenomUsuelUniteLegale,
    establishment.uniteLegale.nomUniteLegale,
  ]
    .filter((s) => !!s)
    .join(" ");
};

type EstablishmentInfo = {
  businessName: string;
  businessAddress: string;
  naf?: NafDto;
};

export const fetchEstablishmentInfoBySiret = async (
  siret: string,
): Promise<EstablishmentInfo> => {
  const info = await immersionApplicationGateway.getSiretInfo(siret);
  const establishment = info.etablissements[0];
  const businessAddress = addressDictToString(
    establishment.adresseEtablissement,
  );
  const withNaf =
    establishment.uniteLegale.activitePrincipaleUniteLegale &&
    establishment.uniteLegale.activitePrincipaleUniteLegale;
  return {
    businessName: getBusinessName(establishment),
    businessAddress,
    ...(withNaf
      ? {
          naf: {
            code: establishment.uniteLegale.activitePrincipaleUniteLegale!,
            nomenclature:
              establishment.uniteLegale.activitePrincipaleUniteLegale!,
          },
        }
      : {}),
  };
};

export const useSiretRelatedField = <K extends keyof EstablishmentInfo>(
  fieldFromInfo: K,
  establishmentInfos: EstablishmentInfo | undefined,
  fieldToUpdate?: string,
) => {
  const [_, { touched }, { setValue }] = useField<EstablishmentInfo[K]>({
    name: fieldToUpdate ?? fieldFromInfo,
  });

  useEffect(() => {
    if (!establishmentInfos) return;
    if (!touched) setValue(establishmentInfos[fieldFromInfo]);
  }, [establishmentInfos]);
};

export const useSiretFetcher = () => {
  const [isFetchingSiret, setIsFetchingSiret] = useState(false);
  const [establishmentInfo, setEstablishmentInfo] = useState<
    EstablishmentInfo | undefined
  >();

  const [field, _, { setValue, setError }] = useField<string>({
    name: "siret",
  });

  useEffect(() => {
    const sanitizedSiret = field.value.replace(/\s/g, "");
    if (sanitizedSiret.length !== 14) return;

    setIsFetchingSiret(true);
    fetchEstablishmentInfoBySiret(sanitizedSiret)
      .then((info) => {
        setValue(sanitizedSiret);
        setEstablishmentInfo(info);
      })
      .catch((err: AxiosError) => {
        if (err.isAxiosError && err.code === "404") {
          setError("SIRET inconnu ou inactif");
        } else {
          setError(err.message);
        }
      })
      .finally(() => setIsFetchingSiret(false));
  }, [field.value]);

  return { establishmentInfo, isFetchingSiret };
};
