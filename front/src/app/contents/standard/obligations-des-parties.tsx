import { SectionTitle } from "./headings";
import type { VersionnedStandardContent } from "./textSetup";

export default {
  latest: {
    title: "Obligations des parties",
    content: () => <LatestStakeholderObligationsContent />,
  },
} satisfies VersionnedStandardContent;

const LatestStakeholderObligationsContent = () => (
  <>
    <SectionTitle>Le bénéficiaire s’engage</SectionTitle>
    <p>
      À exercer les activités et tâches telles que définies dans la présente
      convention et à mettre en œuvre l’ensemble des actions lui permettant
      d’atteindre les objectifs d’insertion socioprofessionnelle attendus, et
      notamment :
    </p>
    <ul>
      <li>
        Respecter le règlement intérieur de la structure d’accueil et les
        consignes qui lui sont données et informer le conseiller référent de
        tout retard ou absence en fournissant les documents justificatifs requis
        ;
      </li>
      <li>
        Se conformer à l’ensemble des dispositions et mesures en matière
        d’hygiène et de sécurité applicables aux salariés dans la structure
        d’accueil, notamment en matière de port obligatoire des EPI et propres
        aux activités et tâches confiées ;
      </li>
      <li>Informer le conseiller référent de tout incident et/ou accident ;</li>
      <li>
        Informer le conseiller référent et/ou la personne responsable de son
        accueil et de son suivi des difficultés qu’il pourrait rencontrer dans
        la mise en œuvre de cette période ;
      </li>
      <li>
        Auto évaluer l’apport de la période de mise en situation en milieu
        professionnel dans la construction de son parcours d’insertion
        socioprofessionnelle.
      </li>
    </ul>

    <SectionTitle>La structure d’accueil</SectionTitle>
    <p>
      S’engage à prendre l’ensemble des dispositions nécessaires en vue de
      permettre au bénéficiaire d’exercer les activités et tâches telles que
      définies dans la présente convention, à l’accompagner afin de lui
      permettre d’atteindre les objectifs d’insertion socioprofessionnelle
      attendus, et notamment à :
    </p>
    <ul>
      <li>
        Désigner une personne chargée d’accueillir, d’aider, d’informer, de
        guider et d’évaluer le bénéficiaire pendant la période de mise en
        situation en milieu professionnel ;
      </li>
      <li>
        Ne pas faire exécuter au bénéficiaire une tâche régulière correspondant
        à un poste de travail permanent, à un accroissement temporaire
        d’activité, à un emploi saisonnier ou au remplacement d’un salarié en
        cas d’absence ou de suspension de son contrat de travail ;
      </li>
      <li>
        S’assurer que la mise en situation en milieu professionnel respecte les
        règles applicables à ses salariés pour ce qui a trait aux durées
        quotidienne et hebdomadaire de présence, à la présence de nuit, au repos
        quotidien, hebdomadaire et aux jours fériés ;
      </li>
      <li>
        Etre couvert par une assurance Multirisque Professionnelle en cours de
        validité tant à l’encontre de tiers que sur des biens de la structure
        d’accueil ;
      </li>
      <li>
        Mettre en œuvre toutes les dispositions nécessaires en vue de se
        conformer aux articles R. 4141-3-1 et suivants du code du travail en
        matière d’information des salariés sur les règles d’hygiène et de
        sécurité applicables dans son établissement et fournir l’ensemble des
        EPI nécessaires ;
      </li>
      <li>
        Prévenir dès connaissance des faits, et au plus tard dans les 24 heures,
        la structure d’accompagnement de tout accident survenant soit au cours
        ou sur le lieu de la mise en situation en milieu professionnel, soit au
        cours du trajet domicile-structure d’accueil ;
      </li>
      <li>
        Donner accès aux moyens de transport et installations collectifs ;
      </li>
      <li>
        Libérer, à la demande de la structure d’accompagnement, le bénéficiaire
        chaque fois que cela s’avère nécessaire.
      </li>
    </ul>

    <SectionTitle>La structure d’accompagnement</SectionTitle>
    <p>
      S’engage, en la personne du conseiller référent, à assurer la mise en
      œuvre de la période de mise en situation en milieu professionnel, et
      notamment à :
    </p>
    <ul>
      <li>
        Assurer l’accompagnement dans la structure d’accueil du bénéficiaire au
        travers de visites et d’entretiens sous toute forme ;
      </li>
      <li>
        Intervenir, à la demande de la structure d’accueil et/ou du bénéficiaire
        pour régler toute difficulté pouvant survenir pendant la période de mise
        en situation en milieu professionnel ;
      </li>
      <li>
        Informer sans délai l’organisme prescripteur ou, si le bénéficiaire est
        salarié, l’employeur de ce dernier, de tout accident survenant au cours
        ou sur le lieu de la mise en situation en milieu professionnel ou de
        trajet qui lui serait signalé dans le cadre de cette période ;
      </li>
      <li>
        Réaliser le bilan / évaluation de la mise en situation réalisée,
        transmis, le cas échéant, à l’organisme prescripteur.
      </li>
    </ul>

    <SectionTitle>L’organisme prescripteur</SectionTitle>
    <p>S’engage à :</p>
    <ul>
      <li>
        Analyser la pertinence de la période de mise en situation en milieu
        professionnel proposée et d’en définir des objectifs adaptés aux
        besoins, possibilités et capacités tant du bénéficiaire que de la
        structure d’accueil ;
      </li>
      <li>
        Procéder à la déclaration dans les 48 heures de tout accident de travail
        ou de trajet qui lui serait signalé auprès de la Caisse Primaire
        d’Assurance Maladie du lieu de résidence du bénéficiaire dès lors qu’il
        couvre le risque AT/MP.
      </li>
    </ul>
  </>
);
