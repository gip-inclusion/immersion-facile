import React from "react";
import immersionFacileLogo from "src/assets/logo-immersion-facile.svg";
import { BulletPoint } from "src/components/BulletPoint";
import { Colored } from "src/components/Colored";
import { Footer } from "src/components/Footer";
import { MarianneLogo } from "src/components/MarianneHeader";
import { Title } from "src/components/Title";
import { routes } from "src/app/routes";

export const Landing = () => (
    <div>
        <section className="flex justify-left mx-3 sm:mx-20">
            <MarianneLogo />
            <div
                className="flex flex-wrap justify-center"
                style={{ minWidth: "420px" }}
            ><img src={immersionFacileLogo} alt="Logo Immersion-Facile" /><            
            /div>
        </section>
        <section className="flex flex-col items-center">
            <div
                className="flex flex-wrap justify-center"
                style={{ minWidth: "420px" }}
            >
                <div className="p-2 m-2 w-48 bg-blue-50 rounded flex flex-col items-center" style={{ width: "400px" }}>
                    <div className="text-immersionBlue-dark  text-center font-light">ENTREPRISE</div>
                    <div className="text-immersionBlue-dark font-semibold text-center">Vos équipes souhaitent accueillir des immersions professionnelles?
                    </div>
                    <a
                        {...routes.formEstablishment().link}
                        className="no-underline shadow-none bg-immersionBlue py-3 px-8 rounded-md text-white font-semibold my-3"
                        target="_blank"
                    >
                        Référencer votre entreprise
                    </a>

                </div>
                <div className="p-2 m-2 w-48 bg-red-50 rounded flex flex-col items-center" style={{ width: "400px" }}>
                    <div className="text-immersionRed-dark text-center  font-light ext-immersionRed-dark">CANDIDAT A UNE IMMERSION</div>
                    <div className="text-immersionRed-dark font-semibold text-center">Vous voulez essayez un métier en conditions réelles?
                    </div>
                    <a
                        {...routes.immersionApplication().link}
                        className="no-underline shadow-none bg-immersionRed py-3 px-8 rounded-md text-white font-semibold my-3"
                        target="_blank"
                    >
                        Faire une demande d'immersion professionnelle
                    </a>

                </div>
            </div>
        </section >
        <section className="flex flex-col items-center">
            <Title red>L'immersion facile, comment ça fonctionne ?</Title>
            <div className="flex max-w-7xl flex-wrap justify-center items-center">
                <div className="max-w-xs" style={{ minWidth: "250px" }}>
                    <BulletPoint red num={1}>
                        <Colored red>Sélectionnez les métiers</Colored> pour lesquels chaque
                        établissement peut accueillir en immersion et préciser un contact
                        "référent immersion professionnelle".
                    </BulletPoint>
                    <BulletPoint red num={2}>
                        <Colored red>Recevez les demandes</Colored> des candidats à la
                        recherche d'opportunités d'immersion.
                    </BulletPoint>
                    <BulletPoint red num={3}>
                        <Colored red>Signer la convention</Colored> avec le candidat et
                        débuter l'immersion professionnelle.
                    </BulletPoint>
                </div>
                <div
                    className="pl-4 flex flex-col items-center"
                    style={{ width: "480px" }}
                >
                    <div className="text-immersionRed-dark font-semibold text-center py-4">
                        L'immersion professionnelle,
                        mode d'emploi
                    </div>
                    <div className="border-blue-200 border border-solid">
                        <iframe
                            width="480"
                            height="270"
                            src="https://www.powtoon.com/embed/e1lglPbeknD/"
                            frameBorder="0"
                            allowFullScreen
                        />
                    </div>
                </div>
            </div>
        </section>
        <Footer />
    </div >
);
