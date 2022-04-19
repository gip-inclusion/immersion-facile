import React from "react";
import { EstablishmentHomeMenu } from "src/app/components/EstablishmentHomeMenu";
import { ImmersionFooter } from "src/app/components/ImmersionFooter";
import { ImmersionMarianneHeader } from "src/app/components/ImmersionMarianneHeader";
import { ImmersionHomeMenu } from "src/app/components/ImmertionHomeMenu";
import { clientApplication } from "src/app/config/application";
import { ENV } from "src/environmentVariables";
import { HomeImmersionHowTo } from "src/uiComponents/ImmersionHowTo";


const DebugInfo = () => (
  <div>
    <br />
    Env variables are:
    <br />
    {Object.entries(ENV).map(([envName, envValue]) => (
      <div key={envName} style={{ width: "400px" }}>
        {envName}: {JSON.stringify(envValue, null, 2)}
      </div>
    ))}
  </div>
);

type HomeProps = {
  showDebugInfo: boolean;
};

export const HomePage = ({ showDebugInfo }: HomeProps) => (
  <div className="relative">
    <div
      className="absolute left-0 top-0 right-0 bottom-0 "
      style={{ zIndex: -1 }}
    >
      <div className="bg-white w-full h-48" />
      <div className="bg-red-50 w-full h-full bg-gradient-to-b from-gray-100 via-gray-50 to-white" />
    </div>
    {showDebugInfo && <DebugInfo />}
    <ImmersionMarianneHeader />
    <section className="flex flex-col items-center mt-14">
      <div
        className="flex flex-wrap justify-center "
        style={{ minWidth: "420px" }}
      >
        <ImmersionHomeMenu/>
        <EstablishmentHomeMenu clientApplication={clientApplication}/>
        {/* OLD MENUS
        <div
          className="border-2 border-blue-200 px-4  p-8 m-2 w-48 bg-blue-50  flex flex-col items-center justify-between "
          style={{ width: "400px", height: "250px" }}
        >
          <div className="text-immersionBlue-dark  text-center text-sm py-2 tracking-widest">
            ENTREPRISE
          </div>
          <div
            className="text-immersionBlue-dark font-semibold text-center"
            style={{ maxWidth: "16rem" }}
          >
            Vos équipes souhaitent accueillir en immersion professionnelle ?
          </div>
          <a
            {...routes.formEstablishment().link}
            className="no-underline shadow-none bg-immersionBlue py-3 px-2 rounded-md text-white font-semibold w-full text-center  h-15 text-sm "
          >
            Référencer votre entreprise
          </a>
          <div
            className="text-immersionBlue-dark font-sans text-center"
            style={{ maxWidth: "16rem" }}
          >
            <a {...routes.landingEstablishment().link}>En savoir plus</a>
          </div>
        </div>
        <div
          className="border-2 border-red-200 px-4  p-8 m-2 w-48 bg-red-50  flex flex-col items-center justify-between"
          style={{ width: "400px", height: "250px" }}
        >
          <div className="text-immersionRed-dark text-center ext-immersionRed-dark text-sm py-2  tracking-widest">
            CANDIDAT À UNE IMMERSION
          </div>
          <div className="text-immersionRed-dark font-semibold text-center">
            Vous voulez essayer un métier en conditions réelles ?
          </div>
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
        */}
        
      </div>
    </section>
    <HomeImmersionHowTo />
    <ImmersionFooter />
  </div>
);
