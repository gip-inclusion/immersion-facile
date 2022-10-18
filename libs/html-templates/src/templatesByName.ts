import { EmailType, TemplatedEmail } from "shared";

type CreateEmailVariable<P> = (params: P) => {
  greetings?: string;
  content?: string;
  highlight?: string;
  subContent?: string;
  legals?: string;
  agencyLogoUrl?: string;
  button?: {
    url: string;
    label: string;
  };
};

export const templateByName: {
  [K in EmailType]: {
    subject: string;
    createEmailVariables: CreateEmailVariable<
      Extract<TemplatedEmail, { type: K }>["params"]
    >;
    tags?: string[];
  };
} = {
  AGENCY_WAS_ACTIVATED: {
    subject: "Votre agence a été activée",
    createEmailVariables: ({ agencyName, agencyLogoUrl }) => ({
      content: `<strong>Votre structure prescriptrice d'immersion est activée !</strong> 

        Nous avons bien activé l'accès à la demande de convention dématérialisée pour des immersions professionnelles pour: ${agencyName}. 
        
        Merci à vous !`,
      agencyLogoUrl,
    }),
  },
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
    tags: ["lala"],
  },
  NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  NEW_CONVENTION_AGENCY_NOTIFICATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  VALIDATED_CONVENTION_FINAL_CONFIRMATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  REJECTED_CONVENTION_NOTIFICATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  MAGIC_LINK_RENEWAL: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  BENEFICIARY_OR_ESTABLISHMENT_REPRESENTATIVE_ALREADY_SIGNED_NOTIFICATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
    subject: "Confirmez une demande d'immersion",
    createEmailVariables: ({
      signatoryName,
      beneficiaryName,
      businessName,
      establishmentRepresentativeName,
      beneficiaryRepresentativeName,
      magicLink,
    }) => ({
      greetings: `Bonjour ${signatoryName},`,
      content: `Une demande de convention d'immersion vient d'être enregistrée. Vous devez maintenant la confirmer.
        
        Pour rappel, cette demande concerne : 
           - Le bénéficiaire ${beneficiaryName}${
        beneficiaryRepresentativeName
          ? `\n- ${beneficiaryRepresentativeName}`
          : ""
      }
           - L'entreprise ${businessName}
           - Le tuteur dans l'entreprise ${establishmentRepresentativeName}
        
        Votre confirmation est indispensable pour permettre la validation définitive de la convention par un conseiller.  
        
        Vous devez maintenant confirmer votre demande.`,
      button: { url: magicLink, label: "Pour la confirmer, cliquez ici" },
      highlight: `<strong>Votre confirmation est obligatoire</strong> pour permettre à votre conseiller de valider la convention. Merci  !
        
        La décision de votre conseiller vous sera transmise par mail.
        
        Attention, ne démarrez pas votre immersion tant que vous n'avez pas reçu cette validation ! Vous n'auriez pas de couverture en cas d'accident.`,
      subContent: `Bonne journée !
        
        L'équipe de l'Immersion Facilitée`,
    }),
  },
  CONTACT_BY_EMAIL_REQUEST: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  CONTACT_BY_PHONE_INSTRUCTIONS: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  CONTACT_IN_PERSON_INSTRUCTIONS: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  SHARE_DRAFT_CONVENTION_BY_LINK: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  SUGGEST_EDIT_FORM_ESTABLISHMENT: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  EDIT_FORM_ESTABLISHMENT_LINK: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  CREATE_IMMERSION_ASSESSMENT: {
    subject: "TODO",
    createEmailVariables: () => ({
      content: "TODO",
    }),
  },
  FULL_PREVIEW_EMAIL: {
    subject: "Test contenant toutes les blocs email",
    createEmailVariables: ({ beneficiaryName }) => ({
      greetings: `Bonjour ${beneficiaryName}`,
      content: `Merci d'avoir confirmé votre demande d'immersion. Elle va être transmise à votre conseiller référent.
      
      Il vous informera par mail de la validation ou non de l'immersion. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.`,
      legals: `<strong>Obligations des parties :</strong>
      Le bénéficiaire s’engage à exercer les activités et tâches telles que définies dans la présente convention et à mettre en œuvre l’ensemble des actions lui permettant d’atteindre les objectifs d’insertion socioprofessionnelle attendus, et notamment :
      • Respecter le règlement intérieur de la structure d’accueil et les consignes qui lui sont données et informer le conseiller référent de tout retard ou absence en fournissant les documents justificatifs requis ;
      • Se conformer à l’ensemble des dispositions et mesures en matière d’hygiène et de sécurité applicables aux salariés dans la structure d’accueil, notamment en matière de port obligatoire des EPI et propres aux activités et tâches confiées ;
      • Informer le conseiller référent de tout incident et/ou accident ;
      • Informer le conseiller référent et/ou la personne responsable de son accueil et de son suivi des difficultés qu’il pourrait rencontrer dans la mise en œuvre de cette période ; • Auto évaluer l’apport de la période de mise en situation en milieu professionnel dans la construction de son parcours d’insertion socioprofessionnelle.
      La structure d’accueil s’engage à prendre l’ensemble des dispositions nécessaires en vue de permettre au bénéficiaire d’exercer les activités et tâches telles que définies dans la présente conven- tion, à l’accompagner afin de lui permettre d’atteindre les objectifs d’insertion socioprofessionnelle attendus, et notamment à :
      • Désigner une personne chargée d’accueillir, d’aider, d’informer, de guider et d’évaluer le bénéficiaire pendant la période de mise en situation en milieu professionnel ;
      • Ne pas faire exécuter au bénéficiaire une tâche régulière correspondant à un poste de travail permanent, à un accroissement temporaire d’activité, à un emploi saisonnier ou au remplacement d’un salarié en cas d’absence ou de suspension de son contrat de travail ;
      • S’assurer que la mise en situation en milieu professionnel respecte les règles applicables à ses salariés pour ce qui a trait aux durées quotidienne et hebdomadaire de présence, à la présence de nuit, au repos quotidien, hebdomadaire et aux jours fériés ;
      • Etre couvert par une assurance Multirisque Professionnelle en cours de validité tant à l’encontre de tiers que sur des biens de la structure d’accueil. ;
      • Mettre en œuvre toutes les dispositions nécessaires en vue de se conformer aux articles R.4141-3-1 et suivants du code du travail en matière d’information des salariés sur les règles d’hygiène et de sécurité applicables dans son établissement et fournir l’ensemble des EPI nécessaires ;
      • Prévenir dès connaissance des faits, et au plus tard dans les 24 heures, la structure d’accompagnement de tout accident survenant soit au cours ou sur le lieu de la mise en situation en milieu professionnel, soit au cours du trajet domicile-structure d’accueil ;
      • Donner accès aux moyens de transport et installations collectifs ;
      • Libérer, à la demande de la structure d’accompagnement, le bénéficiaire chaque fois que cela s’avère nécessaire.
      La structure d’accompagnement s’engage, en la personne du conseiller référent, à assurer la mise en œuvre de la période de mise en situation en milieu professionnel et notamment à :
      • Assurer l’accompagnement dans la structure d’accueil du bénéficiaire au travers de visites et d’entretiens sous toute forme ;
      • Intervenir, à la demande de la structure d’accueil et/ou du bénéficiaire pour régler toute difficulté pouvant survenir pendant la période de mise en situation en milieu professionnel ;
      • Informer sans délai l’organisme prescripteur ou, si le bénéficiaire est salarié, l’employeur de ce dernier, de tout accident survenant au cours ou sur le lieu de la mise en situation en milieu professionnel ou de trajet qui lui serait signalé dans le cadre de cette période ;
      • Réaliser le bilan / évaluation de la mise en situation réalisée, transmis, le cas échéant, à l’organisme prescripteur L’organisme prescripteur s’engage, à :
      • Analyser la pertinence de la période de mise en situation en milieu professionnel proposée et d’en définir des objectifs adaptés aux besoins, possibilités et capacités tant du bénéficiaire que de la structure d’accueil ;
      • Procéder à la déclaration dans les 48 heures de tout accident de travail ou de trajet qui lui serait signalé auprès de la Caisse Primaire d’Assurance Maladie du lieu de résidence du béné- ficiaire dès lors qu’il couvre le risque AT/MP.`,
      button: {
        label: "Label de bouton",
        url: "http://www.example.com",
      },
      subContent: `Il vous informera par mail de la validation ou non de l'immersion. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.
      
      Bonne journée,
      L'équipe Immersion Facilitée
      `,
      highlight:
        "Attention, ne démarrez pas cette immersion tant que vous n'avez pas reçu cette validation !",
    }),
  },
};
