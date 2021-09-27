import { AxiosError } from "axios";
import { useField } from "formik";
import { useEffect, useState } from "react";
import { demandeImmersionGateway } from "src/app/main";
import { Establishment } from "src/core-logic/ports/CompanyInfoFromSiretApi";

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

type CompanyInfo = {
  businessName: string;
  address: string;
};

export const fetchCompanyInfoBySiret = async (
  siret: string,
): Promise<CompanyInfo> => {
  const info = await demandeImmersionGateway.getSiretInfo(siret);
  const establishment = info.etablissements[0];
  const address = addressDictToString(establishment.adresseEtablissement);
  return { businessName: getBusinessName(establishment), address };
};

export const useSiretRelatedField = (
  fieldFromInfo: keyof CompanyInfo,
  companyInfos: CompanyInfo | undefined,
  fieldToUpdate?: string,
) => {
  const [_, { touched }, { setValue }] = useField<string>({
    name: fieldToUpdate ?? fieldFromInfo,
  });

  useEffect(() => {
    if (!companyInfos) return;
    if (!touched) setValue(companyInfos[fieldFromInfo]);
  }, [companyInfos]);
};

export const useSiretFetcher = () => {
  const [isFetchingSiret, setIsFetchingSiret] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | undefined>();

  const [field, _, { setValue, setError }] = useField<string>({
    name: "siret",
  });

  useEffect(() => {
    const sanitizedSiret = field.value.replace(/\s/g, "");
    if (sanitizedSiret.length !== 14) return;

    setIsFetchingSiret(true);
    fetchCompanyInfoBySiret(sanitizedSiret)
      .then((info) => {
        setValue(sanitizedSiret);
        setCompanyInfo(info);
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

  return { companyInfo, isFetchingSiret };
};
