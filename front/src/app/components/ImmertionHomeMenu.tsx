import SearchIcon from "@mui/icons-material/Search";
import React from "react";
import {
  EstablishmentSubTitle,
  EstablishmentTitle,
} from "src/uiComponents/Title";
import { routes } from "../routing/routes";

export const ImmersionHomeMenu = () => (
  <div
    className={`border-2 border-red-200 bg-red-50 flex flex-col items-center justify-between px-4 p-1 m-2 w-48`}
    style={{ width: "400px", height: "250px" }}
  >
    <div className="flex flex-col">
      <EstablishmentTitle type={"candidate"} text="CANDIDAT À UNE IMMERSION" />
      <EstablishmentSubTitle
        type={"candidate"}
        text="Vous voulez essayer un métier en conditions réelles ?"
      />
    </div>
    <div className="flex flex-col w-full h-full items-center justify-center">
      <a
        {...routes.search().link}
        className="no-underline shadow-none bg-immersionRed py-3 px-2 mt-1 mb-2 rounded-md text-white font-semibold  w-full text-center h-15 text-sm "
      >
        Trouver une entreprise accueillante <SearchIcon />
      </a>
      <a
        {...routes.immersionApplication().link}
        className="no-underline shadow-none bg-immersionRed py-3 px-2 rounded-md text-white font-semibold  w-full text-center h-15 text-sm "
      >
        J'ai trouvé mon immersion,
        <br />
        Initier une demande de convention
      </a>
    </div>
  </div>
);
