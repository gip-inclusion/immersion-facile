import { SectionTitle, SubSectionTitle, SubSubSectionTitle } from "./headings";
import type { VersionnedStandardContent } from "./textSetup";

export default {
  "2022-12-02": {
    title: "CGU",
    content: () => <Version20221202CguContent />,
  },
  "2023-03-17": {
    title: "Conditions générales d'utilisation d'Immersion Facilitée",
    content: () => <Version20230317CguContent />,
  },
  "2024-11-19": {
    title: "Conditions générales d'utilisation d'Immersion Facilitée",
    content: () => <Version20241119CguContent />,
  },
  latest: {
    title: "Conditions générales d'utilisation d'Immersion Facilitée",
    content: () => <LatestCguContent />,
  },
} satisfies VersionnedStandardContent;

const Version20221202CguContent = () => (
  <>
    <p>
      <strong>
        Les présentes conditions générales d’utilisation (dites « CGU ») fixent
        le cadre juridique de la Plateforme “Immersion Facilitée” et définissent
        les conditions d’accès et d’utilisation des services par l’Utilisateur.
      </strong>
    </p>
    <SectionTitle>Article 1 - Champ d’application</SectionTitle>
    <p>
      L'inscription est ouverte, sans inscription, à toute personne cherchant à
      réaliser une demande d’immersion professionnelle.
    </p>
    <SectionTitle>Article 2 – Objet</SectionTitle>
    <p>
      La plateforme Immersion Facilitée a pour objet de faciliter les immersions
      professionnelles, celles-ci étant un puissant levier d’accompagnement à
      l’emploi.
    </p>
    <SectionTitle>Article 3 – Définitions</SectionTitle>
    <p>
      « L'Utilisateur » est tout usager cherchant à réaliser une demande
      d’immersion professionnelle, notamment en remplissant un formulaire de
      demande. « L'Entreprise » est toute structure d’accueil en immersion
      pouvant être contactée par l’Utilisateur pour une demande d’immersion et
      pouvant compléter un formulaire de demande, aux côtés de l’Utilisateur. «
      Le Prescripteur » est tout agent prescripteur, utilisant « Immersion
      Facilitée », autorisé par la loi, à accéder ou non à une demande
      d’immersion professionnelle. Les « Services » sont les fonctionnalités
      offertes par la plateforme pour répondre à ses finalités. « Le responsable
      de traitement » est la personne qui, au sens de l’article 4 du règlement
      (UE) n°2016/679 du Parlement européen et du Conseil du 27 avril 2016
      relatif à la protection des personnes physiques à l’égard du traitement
      des données à caractère personnel et à la libre circulation de ces données
      détermine les finalités et les moyens des traitements de données à
      caractère personnel.
    </p>
    <SectionTitle>Article 4 - Fonctionnalités</SectionTitle>
    <SubSectionTitle>4.1 Utilisateur :</SubSectionTitle>
    <p>
      Tout Utilisateur peut chercher un terrain d’immersion en s’appuyant sur
      l’annuaire et le moteur de recherche de« Immersion Facilitée» et réaliser
      une demande d’immersion professionnelle, notamment en remplissant un
      formulaire de demande. Ces formulaires figurent sur la plateforme.
    </p>
    <SubSectionTitle>4.2 Entreprise :</SubSectionTitle>
    <p>
      Toute Entreprise peut se référencer dans l’annuaire de « Immersion
      Facilitée », être contactée par un utilisateur par l'intermédiaire des
      services de mise en contact de « Immersion Facilitée » et signifier son
      accord pour la réalisation d’une demande d’immersion professionnelle,
      notamment en remplissant un formulaire de demande. Ces formulaires
      figurent sur la plateforme.
    </p>
    <SubSectionTitle>4.3 Prescripteur :</SubSectionTitle>
    <p>
      Tout Prescripteur utilise « Immersion Facilitée » pour accompagner les
      utilisateurs. Il pourra notamment prendre connaissance du formulaire,
      l’analyser et envoyer sa décision à l’utilisateur et l’Entreprise via «
      Immersion Facilitée ».
    </p>
    <SectionTitle>Article 5 - Responsabilités</SectionTitle>
    <SubSectionTitle>
      5.1 L’éditeur de la « Plateforme IMMERSION FACILITEE » :
    </SubSectionTitle>
    <p>
      Les sources des informations diffusées sur la Plateforme sont réputées
      fiables mais le site ne garantit pas qu’il soit exempt de défauts,
      d’erreurs ou d’omissions. L’éditeur s’autorise à suspendre ou révoquer
      n'importe quel compte et toutes les actions réalisées par ce biais, s’il
      estime que l’usage réalisé du service porte préjudice à son image ou ne
      correspond pas aux exigences de sécurité. L’éditeur s’engage à la
      sécurisation de la Plateforme, notamment en prenant toutes les mesures
      nécessaires permettant de garantir la sécurité et la confidentialité des
      informations fournies. L’éditeur fournit les moyens nécessaires et
      raisonnables pour assurer un accès continu, sans contrepartie financière,
      à la Plateforme. Il se réserve la liberté de faire évoluer, de modifier ou
      de suspendre, sans préavis, la plateforme pour des raisons de maintenance
      ou pour tout autre motif jugé nécessaire.
    </p>
    <SubSectionTitle>5.2 L’Utilisateur</SubSectionTitle>
    <p>
      Toute information transmise par l'Utilisateur est de sa seule
      responsabilité. Il est rappelé que toute personne procédant à une fausse
      déclaration pour elle-même ou pour autrui s’expose, notamment, aux
      sanctions prévues à l’article 441-1 du code pénal, prévoyant des peines
      pouvant aller jusqu’à trois ans d’emprisonnement et 45 000 euros d’amende.
      L'Utilisateur s'engage à ne pas mettre en ligne de contenus ou
      informations contraires aux dispositions légales et réglementaires en
      vigueur. En particulier, l’Utilisateur s’engage à ne pas publier de
      message racistes, sexistes, injurieux, insultants ou contraires à l’ordre
      public. Toute question ou propos peut être supprimé s’il est redondant,
      s’il contrevient à une disposition des présentes CGU, s’il est contraire à
      des dispositions légales ou pour n’importe quelle raison jugée opportune
      par l’équipe de la plateforme, et ce, sans préavis.
    </p>
    <SubSectionTitle>5.3 L’Entreprise</SubSectionTitle>
    <p>
      Toute information transmise par l'Entreprise est de sa seule
      responsabilité. Il est rappelé que toute personne procédant à une fausse
      déclaration pour elle-même ou pour autrui s’expose, notamment, aux
      sanctions prévues à l’article 441-1 du code pénal, prévoyant des peines
      pouvant aller jusqu’à trois ans d’emprisonnement et 45 000 euros d’amende.
      L'Entreprise s'engage à ne pas mettre en ligne de contenus ou informations
      contraires aux dispositions légales et réglementaires en vigueur. En
      particulier, l’Entreprise s’engage à ne pas publier de message raciste,
      sexiste, injurieux, insultant ou contraire à l’ordre public. Toute
      question ou propos peut être supprimé s’il est redondant, s’il contrevient
      à une disposition des présentes CGU, s’il est contraire à des dispositions
      légales ou pour n’importe quelle raison jugée opportune par l’équipe de la
      plateforme, et ce, sans préavis.
    </p>
    <SubSectionTitle>5.3 Le prescripteur</SubSectionTitle>
    <p>
      Le prescripteur s’engage à ne pas commercialiser les données reçues et à
      ne pas les communiquer à des tiers en dehors des cas prévus par la loi. La
      violation de cet engagement engage sa seule responsabilité. Toute
      information transmise par le prescripteur est de sa seule responsabilité.
      Il est rappelé que toute personne procédant à une fausse déclaration pour
      elle-même ou pour autrui s’expose, notamment, aux sanctions prévues à
      l’article 441-1 du code pénal, prévoyant des peines pouvant aller jusqu’à
      trois ans d’emprisonnement et 45 000 euros d’amende. Le prescripteur
      s'engage à ne pas mettre en ligne de contenus ou informations contraires
      aux dispositions légales et réglementaires en vigueur. En particulier, le
      prescripteur s’engage à ne pas publier de message racistes, sexistes,
      injurieux, insultants ou contraires à l’ordre public. De tels propos
      peuvent être supprimés, s’ils contreviennent à une disposition des
      présentes CGU, s’ils sont contraires à des dispositions légales ou pour
      n’importe quelle raison jugée opportune par l’équipe de la plateforme, et
      ce, sans préavis.
    </p>
  </>
);

const Version20230317CguContent = () => (
  <>
    <p>
      <strong>
        Les présentes conditions générales d’utilisation (dites « CGU ») fixent
        le cadre juridique de la Plateforme “Immersion Facilitée” et définissent
        les conditions d’accès et d’utilisation des services par l’Utilisateur.
      </strong>
    </p>
    <SectionTitle>Article 1 - Champ d’application</SectionTitle>
    <p>
      L'inscription est ouverte, sans inscription, à toute personne cherchant à
      réaliser une demande d’immersion professionnelle.
    </p>
    <SectionTitle>Article 2 – Objet</SectionTitle>
    <p>
      La plateforme Immersion Facilitée a pour objet de faciliter les immersions
      professionnelles, celles-ci étant un puissant levier d’accompagnement à
      l’emploi.
    </p>
    <SectionTitle>Article 3 – Définitions</SectionTitle>
    <p>
      « L'Utilisateur » est tout usager cherchant à réaliser une demande
      d’immersion professionnelle, notamment en remplissant un formulaire de
      demande. « L'Entreprise » est toute structure d’accueil en immersion
      pouvant être contactée par l’Utilisateur pour une demande d’immersion et
      pouvant compléter un formulaire de demande, aux côtés de l’Utilisateur. «
      Le Prescripteur » est tout agent prescripteur, utilisant « Immersion
      Facilitée », autorisé par la loi, à accéder ou non à une demande
      d’immersion professionnelle. Les « Services » sont les fonctionnalités
      offertes par la plateforme pour répondre à ses finalités.
    </p>
    <SectionTitle>Article 4 - Fonctionnalités</SectionTitle>
    <SubSectionTitle>4.1 Utilisateur :</SubSectionTitle>
    <p>
      Tout Utilisateur peut chercher un terrain d’immersion en s’appuyant sur
      l’annuaire et le moteur de recherche de« Immersion Facilitée» et réaliser
      une demande d’immersion professionnelle, notamment en remplissant un
      formulaire de demande. Ces formulaires figurent sur la plateforme.
    </p>
    <SubSectionTitle>4.2 Entreprise :</SubSectionTitle>
    <p>
      Toute Entreprise peut se référencer dans l’annuaire de « Immersion
      Facilitée », être contactée par un utilisateur par l'intermédiaire des
      services de mise en contact de « Immersion Facilitée » et signifier son
      accord pour la réalisation d’une demande d’immersion professionnelle,
      notamment en remplissant un formulaire de demande. Ces formulaires
      figurent sur la plateforme.
    </p>
    <SubSectionTitle>4.3 Prescripteur :</SubSectionTitle>
    <p>
      Tout Prescripteur utilise « Immersion Facilitée » pour accompagner les
      utilisateurs. Il pourra notamment prendre connaissance du formulaire,
      l’analyser et envoyer sa décision à l’utilisateur et l’Entreprise via «
      Immersion Facilitée ».
    </p>
    <SectionTitle>Article 5 - Responsabilités</SectionTitle>
    <SubSectionTitle>
      5.1 L’éditeur de la « Plateforme IMMERSION FACILITEE » :
    </SubSectionTitle>
    <p>
      Les sources des informations diffusées sur la Plateforme sont réputées
      fiables mais le site ne garantit pas qu’il soit exempt de défauts,
      d’erreurs ou d’omissions. L’éditeur s’autorise à suspendre ou révoquer
      n'importe quel compte et toutes les actions réalisées par ce biais, s’il
      estime que l’usage réalisé du service porte préjudice à son image ou ne
      correspond pas aux exigences de sécurité. L’éditeur s’engage à la
      sécurisation de la Plateforme, notamment en prenant toutes les mesures
      nécessaires permettant de garantir la sécurité et la confidentialité des
      informations fournies. L’éditeur fournit les moyens nécessaires et
      raisonnables pour assurer un accès continu, sans contrepartie financière,
      à la Plateforme. Il se réserve la liberté de faire évoluer, de modifier ou
      de suspendre, sans préavis, la plateforme pour des raisons de maintenance
      ou pour tout autre motif jugé nécessaire.
    </p>
    <SubSectionTitle>5.2 L’Utilisateur</SubSectionTitle>
    <p>
      Toute information transmise par l'Utilisateur est de sa seule
      responsabilité. Il est rappelé que toute personne procédant à une fausse
      déclaration pour elle-même ou pour autrui s’expose, notamment, aux
      sanctions prévues à l’article 441-1 du code pénal, prévoyant des peines
      pouvant aller jusqu’à trois ans d’emprisonnement et 45 000 euros d’amende.
      L'Utilisateur s'engage à ne pas mettre en ligne de contenus ou
      informations contraires aux dispositions légales et réglementaires en
      vigueur. En particulier, l’Utilisateur s’engage à ne pas publier de
      message racistes, sexistes, injurieux, insultants ou contraires à l’ordre
      public. Toute question ou propos peut être supprimé s’il est redondant,
      s’il contrevient à une disposition des présentes CGU, s’il est contraire à
      des dispositions légales ou pour n’importe quelle raison jugée opportune
      par l’équipe de la plateforme, et ce, sans préavis.
    </p>
    <SubSectionTitle>5.3 L’Entreprise</SubSectionTitle>
    <p>
      Toute information transmise par l'Entreprise est de sa seule
      responsabilité. Il est rappelé que toute personne procédant à une fausse
      déclaration pour elle-même ou pour autrui s’expose, notamment, aux
      sanctions prévues à l’article 441-1 du code pénal, prévoyant des peines
      pouvant aller jusqu’à trois ans d’emprisonnement et 45 000 euros d’amende.
      L'Entreprise s'engage à ne pas mettre en ligne de contenus ou informations
      contraires aux dispositions légales et réglementaires en vigueur. En
      particulier, l’Entreprise s’engage à ne pas publier de message raciste,
      sexiste, injurieux, insultant ou contraire à l’ordre public. Toute
      question ou propos peut être supprimé s’il est redondant, s’il contrevient
      à une disposition des présentes CGU, s’il est contraire à des dispositions
      légales ou pour n’importe quelle raison jugée opportune par l’équipe de la
      plateforme, et ce, sans préavis.
    </p>
    <SubSectionTitle>5.4 Le prescripteur</SubSectionTitle>
    <p>
      Le prescripteur s’engage à ne pas commercialiser les données reçues et à
      ne pas les communiquer à des tiers en dehors des cas prévus par la loi. La
      violation de cet engagement engage sa seule responsabilité. Toute
      information transmise par le prescripteur est de sa seule responsabilité.
      Il est rappelé que toute personne procédant à une fausse déclaration pour
      elle-même ou pour autrui s’expose, notamment, aux sanctions prévues à
      l’article 441-1 du code pénal, prévoyant des peines pouvant aller jusqu’à
      trois ans d’emprisonnement et 45 000 euros d’amende. Le prescripteur
      s'engage à ne pas mettre en ligne de contenus ou informations contraires
      aux dispositions légales et réglementaires en vigueur. En particulier, le
      prescripteur s’engage à ne pas publier de message racistes, sexistes,
      injurieux, insultants ou contraires à l’ordre public. De tels propos
      peuvent être supprimés, s’ils contreviennent à une disposition des
      présentes CGU, s’ils sont contraires à des dispositions légales ou pour
      n’importe quelle raison jugée opportune par l’équipe de la plateforme, et
      ce, sans préavis. Enfin, toute donnée ou information illégalement
      transférée fera l’objet d’une exclusion du service.
    </p>
    <SectionTitle>
      Article 6 - Mise à jour des conditions d’utilisation
    </SectionTitle>
    <p>
      Les termes des présentes conditions d’utilisation peuvent être amendés à
      tout moment, sans préavis, en fonction des modifications apportées à la
      plateforme, de l’évolution de la législation ou pour tout autre motif jugé
      nécessaire. Chaque modification donne lieu à une nouvelle version acceptée
      par les parties.
    </p>
  </>
);

const Version20241119CguContent = () => (
  <>
    <p>
      <strong>
        Les présentes conditions générales d’utilisation (dites « CGU ») fixent
        le cadre juridique de la Plateforme “Immersion Facilitée” et définissent
        les conditions d’accès et d’utilisation des services par l’Utilisateur.
      </strong>
    </p>
    <SectionTitle>Article 1 - Champ d’application</SectionTitle>
    <p>
      L'inscription est ouverte, sans inscription, à toute personne cherchant à
      réaliser une demande d’immersion professionnelle.
    </p>
    <SectionTitle>Article 2 – Objet</SectionTitle>
    <p>
      La plateforme Immersion Facilitée a pour objet de faciliter les immersions
      professionnelles, celles-ci étant un puissant levier d’accompagnement à
      l’emploi.
    </p>
    <SectionTitle>Article 3 – Définitions</SectionTitle>
    <p>
      « L'Utilisateur » est tout usager cherchant à réaliser une demande
      d’immersion professionnelle, notamment en remplissant un formulaire de
      demande. « L'Entreprise » est toute structure d’accueil en immersion
      pouvant être contactée par l’Utilisateur pour une demande d’immersion et
      pouvant compléter un formulaire de demande, aux côtés de l’Utilisateur. «
      Le Prescripteur » est tout agent prescripteur, utilisant « Immersion
      Facilitée », autorisé par la loi, à accéder ou non à une demande
      d’immersion professionnelle. Les « Services » sont les fonctionnalités
      offertes par la plateforme pour répondre à ses finalités.
    </p>
    <SectionTitle>Article 4 - Fonctionnalités</SectionTitle>
    <SubSectionTitle>4.1 Utilisateur :</SubSectionTitle>
    <p>
      Tout Utilisateur peut chercher un terrain d’immersion en s’appuyant sur
      l’annuaire et le moteur de recherche de« Immersion Facilitée» et réaliser
      une demande d’immersion professionnelle, notamment en remplissant un
      formulaire de demande. Ces formulaires figurent sur la plateforme.
    </p>
    <SubSectionTitle>4.2 Entreprise :</SubSectionTitle>
    <p>
      Toute Entreprise peut se référencer dans l’annuaire de « Immersion
      Facilitée », être contactée par un utilisateur par l'intermédiaire des
      services de mise en contact de « Immersion Facilitée » et signifier son
      accord pour la réalisation d’une demande d’immersion professionnelle,
      notamment en remplissant un formulaire de demande. Ces formulaires
      figurent sur la plateforme.
    </p>
    <SubSectionTitle>4.3 Prescripteur :</SubSectionTitle>
    <p>
      Tout Prescripteur utilise « Immersion Facilitée » pour accompagner les
      utilisateurs. Il pourra notamment prendre connaissance du formulaire,
      l’analyser et envoyer sa décision à l’utilisateur et l’Entreprise via «
      Immersion Facilitée ».
    </p>
    <SectionTitle>Article 5 - Responsabilités</SectionTitle>
    <SubSectionTitle>
      5.1 L’éditeur de la « Plateforme IMMERSION FACILITEE » :
    </SubSectionTitle>
    <p>
      Les sources des informations diffusées sur la Plateforme sont réputées
      fiables mais le site ne garantit pas qu’il soit exempt de défauts,
      d’erreurs ou d’omissions. L’éditeur s’autorise à suspendre ou révoquer
      n'importe quel compte et toutes les actions réalisées par ce biais, s’il
      estime que l’usage réalisé du service porte préjudice à son image ou ne
      correspond pas aux exigences de sécurité. L’éditeur s’engage à la
      sécurisation de la Plateforme, notamment en prenant toutes les mesures
      nécessaires permettant de garantir la sécurité et la confidentialité des
      informations fournies. L’éditeur fournit les moyens nécessaires et
      raisonnables pour assurer un accès continu, sans contrepartie financière,
      à la Plateforme. Il se réserve la liberté de faire évoluer, de modifier ou
      de suspendre, sans préavis, la plateforme pour des raisons de maintenance
      ou pour tout autre motif jugé nécessaire.
    </p>
    <SubSectionTitle>5.2 L’Utilisateur</SubSectionTitle>
    <p>
      Toute information transmise par l'Utilisateur est de sa seule
      responsabilité. Il est rappelé que toute personne procédant à une fausse
      déclaration pour elle-même ou pour autrui s’expose, notamment, aux
      sanctions prévues à l’article 441-1 du code pénal, prévoyant des peines
      pouvant aller jusqu’à trois ans d’emprisonnement et 45 000 euros d’amende.
      L'Utilisateur s'engage à ne pas mettre en ligne de contenus ou
      informations contraires aux dispositions légales et réglementaires en
      vigueur. En particulier, l’Utilisateur s’engage à ne pas publier de
      message racistes, sexistes, injurieux, insultants ou contraires à l’ordre
      public. Toute question ou propos peut être supprimé s’il est redondant,
      s’il contrevient à une disposition des présentes CGU, s’il est contraire à
      des dispositions légales ou pour n’importe quelle raison jugée opportune
      par l’équipe de la plateforme, et ce, sans préavis.
    </p>
    <SubSectionTitle>5.3 L’Entreprise</SubSectionTitle>
    <p>
      Toute information transmise par l'Entreprise est de sa seule
      responsabilité. Il est rappelé que toute personne procédant à une fausse
      déclaration pour elle-même ou pour autrui s’expose, notamment, aux
      sanctions prévues à l’article 441-1 du code pénal, prévoyant des peines
      pouvant aller jusqu’à trois ans d’emprisonnement et 45 000 euros d’amende.
      L'Entreprise s'engage à ne pas mettre en ligne de contenus ou informations
      contraires aux dispositions légales et réglementaires en vigueur. En
      particulier, l’Entreprise s’engage à ne pas publier de message raciste,
      sexiste, injurieux, insultant ou contraire à l’ordre public. Toute
      question ou propos peut être supprimé s’il est redondant, s’il contrevient
      à une disposition des présentes CGU, s’il est contraire à des dispositions
      légales ou pour n’importe quelle raison jugée opportune par l’équipe de la
      plateforme, et ce, sans préavis.
    </p>
    <SubSectionTitle>5.4 Le prescripteur</SubSectionTitle>
    <p>
      Le prescripteur s’engage à ne pas commercialiser les données reçues et à
      ne pas les communiquer à des tiers en dehors des cas prévus par la loi. La
      violation de cet engagement engage sa seule responsabilité. Toute
      information transmise par le prescripteur est de sa seule responsabilité.
      Il est rappelé que toute personne procédant à une fausse déclaration pour
      elle-même ou pour autrui s’expose, notamment, aux sanctions prévues à
      l’article 441-1 du code pénal, prévoyant des peines pouvant aller jusqu’à
      trois ans d’emprisonnement et 45 000 euros d’amende. Le prescripteur
      s'engage à ne pas mettre en ligne de contenus ou informations contraires
      aux dispositions légales et réglementaires en vigueur. En particulier, le
      prescripteur s’engage à ne pas publier de message racistes, sexistes,
      injurieux, insultants ou contraires à l’ordre public. De tels propos
      peuvent être supprimés, s’ils contreviennent à une disposition des
      présentes CGU, s’ils sont contraires à des dispositions légales ou pour
      n’importe quelle raison jugée opportune par l’équipe de la plateforme, et
      ce, sans préavis. Conformément à la convention de financement pour la mise
      en oeuvre d’une expérimentation relative à l’accompagnement rénové des
      bénéficiaires du RSA, notamment son article 3.4, les données relatives aux
      prescriptions d’immersions professionnelle réalisées sur la Plateforme par
      les Prescripteurs pour les bénéficiaires du RSA, sont transmises à France
      Travail. Enfin, toute donnée ou information illégalement transférée fera
      l’objet d’une exclusion du service.
    </p>
    <SectionTitle>
      Article 6 - Mise à jour des conditions d’utilisation
    </SectionTitle>
    <p>
      Les termes des présentes conditions d’utilisation peuvent être amendés à
      tout moment, sans préavis, en fonction des modifications apportées à la
      plateforme, de l’évolution de la législation ou pour tout autre motif jugé
      nécessaire. Chaque modification donne lieu à une nouvelle version acceptée
      par les parties.
    </p>
  </>
);

const LatestCguContent = () => (
  <>
    <p>
      <strong>
        Les présentes conditions générales d’utilisation (dites « CGU ») fixent
        le cadre juridique de la Plateforme “Immersion Facilitée” et définissent
        les conditions d’accès et d’utilisation des services par l’Utilisateur.
      </strong>
    </p>
    <SectionTitle>Article 1 - Champ d’application</SectionTitle>
    <p>
      L'inscription est ouverte, sans inscription obligatoire, à toute personne
      cherchant à réaliser une demande d’immersion professionnelle, ainsi qu’aux
      acteurs nécessaires à la réalisation d’une demande de mise en situation en
      milieu professionnel.
    </p>
    <SectionTitle>Article 2 – Objet</SectionTitle>
    <p>
      La plateforme Immersion Facilitée a pour objet de faciliter et
      dématérialiser les immersions professionnelles, celles-ci étant un
      puissant levier d’accompagnement à l’emploi.
    </p>
    <SectionTitle>Article 3 – Définitions</SectionTitle>
    <p>
      « Le candidat » est tout usager cherchant à réaliser une immersion,
      notamment en remplissant un formulaire de demande, via le présent service
      numérique ;
    </p>
    <p>
      « L’Utilisateur » peut être toute personne qui interagit avec le présent
      service numérique, cela peut inclure toute personne qui visite ou accède
      au service qu’il soit authentifié ou non.
    </p>
    <p>
      « L’Utilisateur connecté » est toute personne qui a non seulement
      interagit avec le service numérique, mais qui s’est authentifiée en
      utilisant des identifiants (comme un nom d’utilisateur et un mot de
      passe).
    </p>
    <p>
      « L’Entreprise » est toute structure d’accueil en immersion pouvant être
      contactée par l’Utilisateur pour une demande d’immersion ou pouvant
      compléter un formulaire de demande, aux côtés de l’Utilisateur ;
    </p>
    <p>
      « Le Prescripteur » est tout agent ou salarié prescripteur, utilisant «
      Immersion Facilitée », dont l’organisme est habilité de droit ou le cas
      échéant, selon les critères et modalités de l’article L.5135-2 du code du
      travail ; Il peut s’agir dans le cas des mini-stage des conseillers ou
      agents autorisés d’une chambre consulaire
    </p>
    <p>
      « Le valideur » est toute personne ou entité responsable de l’approbation
      d’une demande, ce qui déclenche le processus de création d’une convention
      ;
    </p>
    <p>
      « Le conseiller » est toute personne ou entité chargée d'une première
      évaluation et approbation d'une demande avant qu'elle ne soit soumise à
      une validation finale.
    </p>
    <p>
      « L’organisme prescripteur » est tout organisme habilité de droit ou selon
      les critères et modalités de l’article L.5135-2 du code du travail à
      prescrire une période de mise en situation en milieu professionnel ;
    </p>
    <p>
      « L’organisme accompagnateur » est toute structure ou entreprise habilitée
      par des organismes prescripteurs de droit et choisie pour accompagner les
      utilisateurs ;
    </p>
    <p>
      « L’immersion » est entendue, toute mise en situation, stage de découverte
      ou période d’observation professionnelle et qui ne dépasse pas 1 mois.
    </p>
    <p>
      « La convention » est la convention relative à l’immersion, ou le cas
      échéant à une période de mise en situation.
    </p>
    <p>
      « Le courriel professionnel » est, par principe, le courriel utilisé
      professionnellement par un salarié ou agent et dont le nom de domaine
      correspondant à son organisme ou son entreprise.
    </p>
    <p>
      Les « Services » sont les fonctionnalités offertes par la plateforme pour
      répondre à ses finalités.
    </p>
    <SectionTitle>Article 4 - Fonctionnalités du service</SectionTitle>
    <SubSectionTitle>4.1 Création de compte</SubSectionTitle>
    <p>
      Plusieurs modalités de compte peuvent être créés par les différents types
      d’acteurs de la demande de période de mise en situation en milieu
      professionnel :
    </p>
    <ul>
      <li>
        Les organismes prescripteurs, accompagnateurs et les entreprises peuvent
        avoir un compte « Responsable » qui administrera les autres comptes des
        structures et dont les fonctionnalités et responsabilités comprennent,
        notamment celles des autres comptes ;
      </li>
      <li>
        Les organismes prescripteurs, accompagnateurs et les entreprises peuvent
        avoir un compte qui disposera de fonctionnalités et responsabilités
        définies au sein des présentes conditions générales d’utilisation ;
      </li>
      <li>
        Les candidats peuvent avoir un compte qui leur permet d’accéder aux
        données les concernant stricto sensu et d’opérer des actions : mises en
        relation et discussions avec les entreprises et demandes de convention
        dont ils sont l’objet.
      </li>
    </ul>
    <p>
      Chaque titulaire de compte est tenu à la confidentialité des informations
      qu’il a à sa disposition. Tout utilisateur s'assure de garder son mot de
      passe secret. Celui-ci respecte les recommandations de la CNIL (12
      caractères, dont 1 minuscule, 1 majuscule, 1 signe spécial et 1 chiffre)
      avec limitation. Toute divulgation du mot de passe, quelle que soit sa
      forme, est interdite. Il assume les risques liés à la divulgation de son
      adresse électronique et mot de passe, et de manière générale à toute
      négligence liée à la confidentialité de ces éléments.
    </p>
    <SubSectionTitle>A. Compte « Responsable »</SubSectionTitle>
    <SubSubSectionTitle>
      Modalités de création du compte « responsable »
    </SubSubSectionTitle>
    <p>
      Les structures qui le peuvent en application de l’article 4.1 des
      présentes conditions générales d’utilisation, doivent créer leur premier
      compte par une personne habilitée au sein de la structure et qui aura un
      rôle « Responsable ». La personne doit saisir un obligatoirement un
      courriel professionnel et y joindre un SIRET. Il désigne les comptes qui
      auront la fonction valideurs de conventions. Il peut retirer cette faculté
      dans les mêmes conditions.
    </p>
    <p>
      Si la création de compte concerne un prescripteur, le GIP « Plateforme de
      l’inclusion » vérifie la cohérence entre le courriel et l’organisme, ainsi
      que le SIRET. En cas d’incohérence, la demande est rejetée. La décision
      est communiquée et en présente les raisons. Ce rejet est sans préjudice
      d’une exclusion de compte consécutive à une usurpation de l’identité d’une
      personne physique ou de la personne morale.
    </p>
    <p>
      Si la création de compte concerne un organisme d’accompagnement, les
      informations communiquées sont transmises à son prescripteur de
      rattachement. Celui-ci vérifie la cohérence des informations et valide la
      création de compte.
    </p>
    <SubSubSectionTitle>
      Contestation de la décision de rejet
    </SubSubSectionTitle>
    <p>
      La structure peut contester le rejet de la demande dans un délai d’une
      semaine à compter de la réception de la demande. Il présente les éléments
      corrigeant l’incohérence détectée. Le GIP « Plateforme de l’inclusion »
      lui répond dans un délai d’un mois maximum.
    </p>
    <SubSectionTitle>B. Comptes « Utilisateurs »</SubSectionTitle>
    <SubSubSectionTitle>Candidat</SubSubSectionTitle>
    <p>
      La création du compte se fait via le site « Immersion Facilitée ». Elle
      est réalisée au moment d’une demande de saisie de convention en ligne ou
      lors d’une prise de contact avec une entreprise inscrite sur la
      plateforme.
    </p>
    <SubSubSectionTitle>
      Prescripteurs et agents d’organismes d’accompagnement
    </SubSubSectionTitle>
    <p>
      L’inscription se fait via ProConnect et est validée par les
      administrateurs d’Immersion Facilitée (GIP de l’inclusion) ou le cas
      échéant par le prescripteur de droit commun avec qui il est lié. Le
      contrôle s’opère par le nom de domaine du mail (courriel professionnel).
      Pour les autres agents du prescripteur ou d’un organisme d’accompagnement,
      l’inscription se fait par invitation par le responsable qui aura la
      responsabilité d’ajouter et de valider les personnes et de leur donner les
      droits afférents à leur fonction.
    </p>
    <SubSubSectionTitle>Entreprises</SubSubSectionTitle>
    <p>
      L’inscription du responsable se fait via Pro Connect et est validée par
      les administrateurs d’Immersion Facilitée (GIP Plateforme de l’inclusion)
      dans les mêmes conditions que le compte « Responsable ».
    </p>
    <p>
      Les comptes des salariés et agents des « Entreprises » sont créés
      systématiquement par un compte « Responsable » de la structure ou
      organisme pour lequel il travaille ou pour le compte duquel il agit.
    </p>
    <p>
      Le GIP « Plateforme de l’inclusion » peut vérifier la cohérence entre le
      courriel et l’organisme. En cas de décision de rejet de la création de
      compte, le titulaire du compte « Responsable » peut contester la décision
      dans les mêmes conditions que celles prévues par l’article 4.1 liées au
      compte « Responsable ».
    </p>
    <SubSubSectionTitle>Utilisation sans compte</SubSubSectionTitle>
    <p>
      Les fonctionnalités du site, y compris la demande de réalisation de
      convention peuvent se réaliser sans compte.
    </p>
    <SubSectionTitle>4.2 Recherche d’entreprise ou d’organisme</SubSectionTitle>
    <p>
      Tout Utilisateur peut chercher un terrain d’immersion en s’appuyant sur
      l’annuaire et le moteur de recherche de « Immersion Facilitée » et
      réaliser une demande de mise en situation en milieu professionnel ou de
      mini stage, notamment en remplissant un formulaire de demande. Les
      utilisateurs recherchent le métier, la ville et la distance maximum pour
      réaliser son immersion professionnelle. Lorsque l’utilisateur est
      candidat, il peut contacter une entreprise qu’il aura choisi en
      remplissant un formulaire comprenant des données à caractère personnel :
      prénom, nom, adresse électronique, numéro de téléphone, expériences
      professionnelles (champs libres), page LinkedIn ou CV.
    </p>
    <SubSectionTitle>4.3 Mise en relation</SubSectionTitle>
    <p>
      Les candidats et les organismes avec lesquels ils sont en relation
      échangent sur les besoins et modalités d’une éventuelle immersion.
    </p>
    <SubSectionTitle>4.4 Conventionnement d’immersion</SubSectionTitle>
    <SubSectionTitle>
      A. Règles relatives à la demande de convention
    </SubSectionTitle>
    <p>La demande de convention peut être entamée et commencée soit :</p>
    <ul>
      <li>Par le candidat ;</li>
      <li>Par l’entreprise ;</li>
      <li>Par un prescripteur ;</li>
      <li>Par un salarié d’un organisme d’accompagnement</li>
    </ul>
    <p>
      Dès que la demande est réalisée, un ID lui est adjoint et est relié à un
      candidat, une entreprise et un prescripteur.
    </p>
    <SubSubSectionTitle>Demande de convention avec compte</SubSubSectionTitle>
    <p>
      Une entreprise peut initier une demande de convention depuis son espace
      connecté, en réponse à une demande de mise en relation transmise par un
      candidat. Cette demande de convention sera préremplie avec les données
      issues de la mise en relation : métier, objet de l’immersion, coordonnées
      du candidat telles qu’il les a saisies dans le formulaire de contact
      transmis à l’entreprise et coordonnées de l’entreprise telles qu’elles ont
      été saisies dans l’annuaire des entreprises accueillantes.
    </p>
    <SubSubSectionTitle>
      Demande de convention sans compte et sans identifiant France Travail
    </SubSubSectionTitle>
    <p>
      Sans identifiant France Travail, une entreprise, un candidat ou un
      conseiller accompagnant un candidat peuvent remplir une convention en
      indiquant totalement ou partiellement toutes les informations requises
      dans le formulaire.
    </p>
    <SubSubSectionTitle>
      Demande de convention sans compte avec identifiant France Travail
    </SubSubSectionTitle>
    <p>
      Un candidat inscrit à France Travail remplit une convention. Il peut
      s’être identifié avec ses identifiants France Travail : nom d’utilisateur
      et mot de passe France Travail. Dans ce cas, la convention sera préremplie
      avec les coordonnées du candidat (nom prénom -mail) transmis par France
      Travail
    </p>
    <SubSubSectionTitle>
      Récupération et modification de la convention
    </SubSubSectionTitle>
    <p>
      Une demande de convention incomplète peut être partagée par mail ou par
      l’intermédiaire du service à une autre partie prenante de l’immersion. Les
      données déjà complétées seront alors partagées avec le destinataire du
      partage de la demande de convention. Seules les personnes et les
      organismes étant partie à la convention ou ayant à signer celle-ci peuvent
      récupérer ou modifier la convention de mise en situation en milieu
      professionnel.
    </p>
    <SubSubSectionTitle>
      Validation par le prescripteur et signature de la convention
    </SubSubSectionTitle>
    <p>
      Toutes les signatures et modifications sont tracées et historisées dans la
      base d’Immersion Facilitée. Si une demande de convention est modifiée par
      une des parties, les signatures préalablement recueillies sont annulées.
      La demande de convention modifiée doit de nouveau être signée par chacune
      des parties prenantes.
    </p>
    <p>
      Une convention ne peut pas être validée par un « prescripteur » tant que
      toutes les parties prenantes ne l'ont pas signée.
    </p>
    <p>
      A compter de la validation par le « Prescripteur » auquel est rattachée la
      convention, celle-ci dans sa version « finale » ne peut plus être modifiée
      et est transmise à toutes les parties.
    </p>
    <p>
      Pour les organismes, seuls les utilisateurs ayant le rôle de « valideur »
      peuvent signer des conventions. Ils sont réputés être représentants légaux
      ou détenteur d’une autorité de signature.
    </p>
    <SubSubSectionTitle>Annulation de la convention</SubSubSectionTitle>
    <p>
      Si l’immersion ne s’est pas réalisée, la convention peut être annulée par
      le prescripteur.
    </p>
    <p>
      Une demande de convention d’immersion non totalement signée ou validée est
      passée automatiquement en statut “obsolète” trois mois après la date de
      début de l’immersion. Elle n’est alors plus modifiable.
    </p>
    <SubSectionTitle>4.5 Référencement de structure</SubSectionTitle>
    <p>
      Toute Entreprise peut se référencer dans l’annuaire de « Immersion
      Facilitée », être contactée par un utilisateur par l’intermédiaire des
      services de mise en contact de « Immersion Facilitée » et signifier son
      accord pour la réalisation d’une demande d’immersion professionnelle,
      notamment en répondant à un formulaire de demande. Ces formulaires
      figurent sur la plateforme.
    </p>
    <p>Lorsque l’entreprise souhaite être référencée, elle précise :</p>
    <ul>
      <li>
        Si elle est disponible pour recevoir des personnes en immersion et
        combien de mises en relation par mois au maximum ;
      </li>
      <li>
        La catégorie de publics visés (ex : publics scolaires, non-scolaires,
        les deux) ;
      </li>
      <li>
        Les modalités d’exercice de travail par métier (télétravail, hybride, en
        présentiel)
      </li>
    </ul>
    <p>
      Un prescripteur ou une structure d’accompagnement peut ajouter son
      organisme encadrant les PMSMP. Outre l’adresse électronique de contact,
      seules des informations publiques à propos de l’organisme figurent sur la
      fiche de référencement.
    </p>
    <SubSectionTitle>4.6 Accès aux dossiers archivés</SubSectionTitle>
    <p>
      Tout accès aux dossiers archivés est interdit. Par dérogation, un compte
      peut accéder aux dossiers d’un candidat qu’il a préalablement suivi en cas
      de litige judiciaire, ou pour présenter la preuve de la réalisation d’une
      mise en situation sur demande de la personne concernée ou d’un conseiller
      du Réseau pour l’emploi. Toute autre demande d’accès ne peut se faire que
      sur autorisation de l’éditeur.
    </p>
    <SectionTitle>Article 5 – Responsabilités et engagements</SectionTitle>
    <SubSectionTitle>
      5.1 Responsabilités et engagements généraux
    </SubSectionTitle>
    <p>
      Les modalités d’échanges peuvent être contrôlées a posteriori, si des
      violations des conditions générales d’utilisation, notamment eu égard au
      comportement et propos, sont portées à la connaissance du GIP « Plateforme
      de l’inclusion ». L'Utilisateur s'engage à ne pas mettre en ligne de
      contenus ou informations contraires aux dispositions légales et
      réglementaires en vigueur. En particulier, l’Utilisateur s’engage à ne pas
      publier ou envoyer de message racistes, sexistes, injurieux, insultants ou
      contraires à l’ordre public.
    </p>
    <p>
      Toute question ou propos peut être supprimé s’il est redondant, s’il
      contrevient à une disposition des présentes conditions générales
      d’utilisation, s’il est contraire à des dispositions légales ou pour
      n’importe quelle raison légitime jugée opportune par l’équipe de la
      plateforme, et ce, sans préavis.
    </p>
    <p>
      Les Utilisateurs s‘engagent à ne pas utiliser le service pour du
      conventionnement de formations.
    </p>
    <p>
      Toute information transmise par l'Utilisateur est de sa seule
      responsabilité. Il est rappelé que toute personne procédant à une fausse
      déclaration pour elle-même ou pour autrui s’expose, notamment, aux
      sanctions prévues à l’article 441-1 du code pénal, prévoyant des peines
      pouvant aller jusqu’à trois ans d’emprisonnement et 45 000 euros d’amende.
    </p>
    <p>
      Toute usurpation d’identité entraîne la suppression immédiate du compte,
      et le cas échéant des poursuites pénales. En cas de sanction de
      suppression, le GIP informe le candidat par courriel et lui précise les
      motifs de la décision prévue. Le candidat mis en cause dispose d’un délai
      d’une semaine pour apporter le contradictoire par mail via l’adresse :
      contact@immersion-facile.beta.gouv.fr .
    </p>
    <p>
      En cas d’absence de réponse, la décision est prise et confirmée. En cas de
      silence du GIP sous une semaine, la décision est réputée confirmée.
    </p>
    <SubSectionTitle>
      5.2 Responsabilité et engagements du candidat et de l’entreprise
    </SubSectionTitle>
    <p>
      Outre les obligations de l’article 5.1, le candidat et l’entreprise
      s’engagent à avoir une utilisation respectueuse et responsable du service
      numérique.
    </p>
    <p>
      Les entreprises inscrites dans l’annuaire des entreprises accueillantes
      peuvent être supprimées en cas d’absence systématique de réponse aux
      candidats qui les contactent.
    </p>
    <SubSectionTitle>
      5.3 – Responsabilités et engagements spécifiques aux organismes de
      prescription et aux organismes d’accompagnement
    </SubSectionTitle>
    <p>
      Outre les obligations de l’article 5.1, le prescripteur ou l’organisme
      d’accompagnement s’engage à ne pas commercialiser les données reçues et à
      ne pas les communiquer à des tiers en dehors des cas prévus par la loi. La
      violation de cet engagement engage sa seule responsabilité.
    </p>
    <p>
      Les organismes sont tenus de la vérification des données contenues dans la
      convention, conformément à l’article D.5135-6 du code du travail.
    </p>
    <p>
      Tout accès frauduleux, c’est-à-dire fondé sur une justification erronée ou
      non justifiée conformément aux présentes conditions générales
      d’utilisation aux dossiers archivés, notamment son article 4.6, constitue
      un manquement contractuel susceptible d’une suspension ou d’une
      suppression de compte. La preuve de la justification incombe au demandeur
      d’accès.
    </p>
    <p>
      La suspicion d’un accès frauduleux ou non justifié conformément aux
      présentes conditions entraîne la suspension préventive du compte ou le cas
      échéant le non accès aux dossiers archivés.
    </p>
    <SubSectionTitle>
      5.4 – Responsabilités et engagements spécifiques aux entreprises
    </SubSectionTitle>
    <p>
      Outre les obligations de l’article 5.1, l’entreprise s’engage à ne pas
      commercialiser les données reçues et à ne pas les communiquer à des tiers
      en dehors des cas prévus par la loi. La violation de cet engagement engage
      sa seule responsabilité.
    </p>
    <SubSectionTitle>
      5.5 – Responsabilités et engagements de l’éditeur du service numérique
    </SubSectionTitle>
    <p>
      Les sources des informations diffusées sur la Plateforme sont réputées
      fiables mais le site ne garantit pas qu’il soit exempt de défauts,
      d’erreurs ou d’omissions.
    </p>
    <p>
      L’éditeur s’autorise à suspendre ou révoquer n'importe quel compte et
      toutes les actions réalisées par ce biais, s’il estime que l’usage réalisé
      du service porte préjudice à son image ou ne correspond pas aux exigences
      de sécurité.
    </p>
    <p>
      Il assure autant que possible la sécurisation de la Plateforme, notamment
      en prenant toutes les mesures nécessaires permettant de garantir la
      sécurité et la confidentialité des informations fournies.
    </p>
    <p>
      L’éditeur fournit les moyens nécessaires et raisonnables pour assurer un
      accès continu, sans contrepartie financière, à la Plateforme. Il se
      réserve la liberté de faire évoluer, de modifier ou de suspendre, sans
      préavis, la plateforme pour des raisons de maintenance ou pour tout autre
      motif jugé nécessaire.
    </p>
    <p>
      Il s’engage, en cas de difficultés relatives à une demande de convention
      (pas de lien de signature, informations erronées, modification ou
      renouvellement d’une convention) à répondre à toute demande de contact
      (avec mention de l’ID de convention et du courriel) via Crisp dans un
      délai moyen de 48 heure ouvré.
    </p>
    <SectionTitle>
      Article 6 - Mise à jour des conditions d’utilisation
    </SectionTitle>
    <p>
      Les termes des présentes conditions d’utilisation peuvent être amendés à
      tout moment, sans préavis, en fonction des modifications apportées à la
      plateforme, de l’évolution de la législation ou pour tout autre motif jugé
      nécessaire. Chaque modification donne lieu à une nouvelle version acceptée
      par les parties.
    </p>
  </>
);
