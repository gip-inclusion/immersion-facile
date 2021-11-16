import React from "react";
import { routes } from "src/app/routes";
import immersionFacileLogo from "src/assets/logo-immersion-facile.svg";
import { Footer } from "src/components/Footer";
import { ImmersionHowTo } from "src/components/ImmersionHowTo";
import { MarianneLogo } from "src/components/MarianneHeader";


import { ENV } from "src/environmentVariables";

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

export const Home = ({ showDebugInfo }: HomeProps) => (
    <div className="relative">
        <div className="absolute left-0 top-0 right-0 bottom-0 " style={{ zIndex: -1 }}>
            <div className=" bg-white w-full h-48" />
            <div className="bg-red-50 w-full h-full bg-gradient-to-b from-gray-100 via-gray-50 to-white" />
        </div>
        {showDebugInfo && <DebugInfo />}
        <section className="flex justify-left mx-3 sm:mx-20">
            <MarianneLogo />
            <div
                className="flex flex-wrap justify-center"
                style={{ minWidth: "420px" }}
            ><img src={immersionFacileLogo} alt="Logo Immersion-Facile" /></div>
        </section>
        <section className="flex flex-col items-center mt-14">
            <div
                className="flex flex-wrap justify-center "
                style={{ minWidth: "420px" }}
            >
                <div className="border-2 border-blue-200 px-4  p-8 m-2 w-48 bg-blue-50  flex flex-col items-center justify-start " style={{ width: "400px", height: "250px" }}>

                    <div className="text-immersionBlue-dark  text-center font-light text-xs py-2 tracking-widest">ENTREPRISE</div>
                    <div className="text-immersionBlue-dark font-semibold text-center">Vos équipes souhaitent accueillir des immersions professionnelles?</div>
                    <a
                        {...routes.formEstablishment().link}
                        className="no-underline shadow-none bg-immersionBlue py-3 px-2 rounded-md text-white font-semibold w-full text-center  h-15 text-sm mt-auto"
                        target="_blank"
                    >
                        Référencer votre entreprise
                    </a>
                </div>
                <div className="border-2 border-red-200 px-4  p-8 m-2 w-48 bg-red-50  flex flex-col items-center " style={{ width: "400px" }}>
                    <div className="text-immersionRed-dark text-center  font-light ext-immersionRed-dark text-xs py-2  tracking-widest">CANDIDAT A UNE IMMERSION</div>
                    <div className="text-immersionRed-dark font-semibold text-center">Vous voulez essayez un métier en conditions réelles?</div>
                    <a
                        {...routes.immersionApplication().link}
                        className="no-underline shadow-none bg-immersionRed py-3 px-2 rounded-md text-white font-semibold  w-full text-center h-15 text-sm mt-auto"
                        target="_blank"
                    >
                        Faire une demande d'immersion professionnelle
                    </a>
                </div>
            </div>
        </section >
        <ImmersionHowTo videoUrl="https://www.powtoon.com/embed/c8x7n7AR2XE/" />
        <Footer />
    </div >
);

