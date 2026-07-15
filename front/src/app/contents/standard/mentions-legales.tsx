import { immersionFacileContactEmail } from "shared";
import type { VersionnedStandardContent } from "src/app/contents/standard/textSetup";
import { SectionTitle } from "./headings";

export default {
  "2022-12-02": {
    title: "Mentions légales",
    content: () => <Version20221202LegalNoticeContent />,
  },
  latest: {
    title: "Mentions légales",
    content: () => <LatestLegalNoticeContent />,
  },
} satisfies VersionnedStandardContent;

const Version20221202LegalNoticeContent = () => (
  <>
    <SectionTitle>Éditeur de la Plateforme</SectionTitle>
    <p>La Plateforme « Immersion Facilitée » est éditée par :</p>
    <p>
      Le Groupement d’intérêt public « Plateforme de l’inclusion » situé :
      <br />
      127 rue de Grenelle
      <br />
      75007 Paris
      <br />
      France
    </p>

    <SectionTitle>Directeur de la publication</SectionTitle>
    <p>
      Le Directeur de la publication est Monsieur Arnaud Denoix, Directeur du
      GIP Plateforme de l’inclusion.
    </p>

    <SectionTitle>Hébergement de la Plateforme</SectionTitle>
    <p>
      Cette plateforme est hébergée par :
      <br />
      Scalingo
      <br />
      15 Avenue du Rhin
      <br />
      67100 Strasbourg
      <br />
      France
    </p>

    <SectionTitle>Accessibilité</SectionTitle>
    <p>
      La conformité aux normes d’accessibilité numérique est un objectif
      ultérieur mais nous tâchons de rendre ce site accessible à toutes et à
      tous.
    </p>

    <SectionTitle>Signaler un dysfonctionnement</SectionTitle>
    <p>
      Si vous rencontrez un défaut d’accessibilité vous empêchant d’accéder à un
      contenu ou une fonctionnalité de la plateforme, merci de nous en faire
      part :{" "}
      <a href={`mailto:${immersionFacileContactEmail}`}>
        {immersionFacileContactEmail}
      </a>
    </p>
    <p>
      Si vous n’obtenez pas de réponse rapide de notre part, vous êtes en droit
      de faire parvenir vos doléances ou une demande de saisine au Défenseur des
      droits.
    </p>
  </>
);

const LatestLegalNoticeContent = () => (
  <>
    <SectionTitle>Éditeur de la Plateforme</SectionTitle>
    <p>La Plateforme « Immersion Facilitée » est éditée par :</p>
    <p>
      France Travail
      <br />
      1-5 avenue du Docteur Gley
      <br />
      75987 Paris cedex 20
      <br />
      Tél. 01 40 30 60 00
      <br />
      France
    </p>

    <SectionTitle>Directeur de la publication</SectionTitle>
    <p>
      Le Directeur de la publication est Thibaut Guilluy, Directeur général.
    </p>

    <SectionTitle>Hébergement de la Plateforme</SectionTitle>
    <p>
      Cette plateforme est hébergée par :
      <br />
      Scalingo
      <br />
      15 Avenue du Rhin
      <br />
      67100 Strasbourg
      <br />
      France
    </p>

    <SectionTitle>Accessibilité</SectionTitle>
    <p>
      La conformité totale aux normes d’accessibilité numérique est un objectif
      ultérieur mais nous tâchons de rendre ce site accessible à toutes et à
      tous.
    </p>

    <SectionTitle>Signaler un dysfonctionnement</SectionTitle>
    <p>
      Si vous rencontrez un défaut d’accessibilité vous empêchant d’accéder à un
      contenu ou une fonctionnalité de la plateforme, merci de nous en faire
      part :{" "}
      <a href={`mailto:${immersionFacileContactEmail}`}>
        {immersionFacileContactEmail}
      </a>
    </p>
    <p>
      Si vous n’obtenez pas de réponse rapide de notre part, vous êtes en droit
      de faire parvenir vos doléances ou une demande de saisine au Défenseur des
      droits.
    </p>
  </>
);
