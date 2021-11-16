import React from "react";
import { BulletPoint } from "./BulletPoint";
import { Colored } from "./Colored";
import { Title } from "./Title";


type ImmersionHowToProps = {
  videoUrl: string;
};

export const ImmersionHowTo = ({ videoUrl }: ImmersionHowToProps) => (
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
          L'immersion professionnelle, mode d'emploi
        </div>
        <div className="border-blue-200 border border-solid">
          <iframe
            width="480"
            height="270"
            src={videoUrl}
            frameBorder="0"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  </section>
);
