import establishmentVideoImage from "/establishment_video_image.png";
import homeVideoImage from "/home_video_image.jpg";
import React from "react";
import {
  BulletPointNumber,
  Colored,
  SubTitle,
  Title,
} from "react-design-system/immersionFacile";

type ImmersionHowToProps = {
  videoUrl: string;
  videoImage: string;
};

const ImmersionHowTo = ({ videoUrl, videoImage }: ImmersionHowToProps) => (
  <section className="flex flex-col items-center">
    <Title red>L'immersion facilitée, comment ça fonctionne ?</Title>
    <div className="flex max-w-7xl flex-wrap justify-center items-center">
      <div className="max-w-xs" style={{ minWidth: "250px" }}>
        <BulletPointNumber red num={1}>
          <Colored red>Sélectionnez les métiers</Colored> pour lesquels chaque
          établissement peut accueillir en immersion.
        </BulletPointNumber>
        <BulletPointNumber red num={2}>
          <Colored red>Recevez les demandes</Colored> des candidats à la
          recherche d'opportunités d'immersion.
        </BulletPointNumber>
        <BulletPointNumber red num={3}>
          <Colored red>Complétez la convention.</Colored> Dès la validation
          reçue, démarrez l’immersion.
        </BulletPointNumber>
        <div className="flex py-1 text-sm sm:mx-3-">
          Vous pouvez être accompagné à chacune de ces étapes par votre
          conseiller emploi habituel. C’est lui qui validera avec vous la
          convention. Vous ne le connaissez pas ? Pas de souci, nous saurons
          l’identifier.
        </div>
      </div>
      <div
        className="px-4 flex flex-col items-center"
        style={{ width: "100%" }}
      >
        <SubTitle red>L'immersion professionnelle, mode d'emploi</SubTitle>
        <div className="border-blue-200 border border-solid">
          <a href={videoUrl} target="_blank">
            <img src={videoImage} width="100%" alt="video_img" />
          </a>
        </div>
      </div>
    </div>
  </section>
);

export const HomeImmersionHowTo = () => (
  <ImmersionHowTo
    videoUrl="https://www.powtoon.com/embed/c8x7n7AR2XE/"
    videoImage={homeVideoImage}
  />
);

export const EstablishmentImmersionHowTo = () => (
  <ImmersionHowTo
    videoUrl="https://www.powtoon.com/embed/e1lglPbeknD/"
    videoImage={establishmentVideoImage}
  />
);
