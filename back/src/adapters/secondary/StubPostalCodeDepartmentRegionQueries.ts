import {
  DepartmentAndRegion,
  PostalCodeDepartmentRegionQueries,
} from "../../domain/generic/geo/ports/PostalCodeDepartmentRegionQueries";

export const StubPostalCodeDepartmentRegionQueries: PostalCodeDepartmentRegionQueries =
  {
    async getAllRegionAndDepartmentByPostalCode(): Promise<
      Record<string, DepartmentAndRegion>
    > {
      return {
        "10000": { department: "Aube", region: "Grand Est" },
        "11000": { department: "Aude", region: "Occitanie" },
        "12000": { department: "Aveyron", region: "Occitanie" },
        "14000": { department: "Calvados", region: "Normandie" },
        "15000": { department: "Cantal", region: "Auvergne-Rhône-Alpes" },
        "16000": { department: "Charente", region: "Nouvelle-Aquitaine" },
        "17000": {
          department: "Charente-Maritime",
          region: "Nouvelle-Aquitaine",
        },
        "18000": { department: "Cher", region: "Centre-Val de Loire" },
        "19000": { department: "Corrèze", region: "Nouvelle-Aquitaine" },
        "27000": { department: "Eure", region: "Normandie" },
        "29000": { department: "Finistère", region: "Bretagne" },
        "30000": { department: "Gard", region: "Occitanie" },
        "32000": { department: "Gers", region: "Occitanie" },
        "34000": { department: "Hérault", region: "Occitanie" },
        "46000": { department: "Lot", region: "Occitanie" },
        "48000": { department: "Lozère", region: "Occitanie" },
        "50000": { department: "Manche", region: "Normandie" },
        "56000": { department: "Morbihan", region: "Bretagne" },
        "61000": { department: "Orne", region: "Normandie" },
        "69120": { department: "Rhône", region: "Auvergne-Rhône-Alpes" },
        "81000": { department: "Tarn", region: "Occitanie" },
        "85000": { department: "Vendée", region: "Pays de la Loire" },
      };
    },
  };
