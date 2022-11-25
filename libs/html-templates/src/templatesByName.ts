import {
  EmailType,
  isStringDate,
  TemplatedEmail,
  toDisplayedDate,
} from "shared";
import { defaultConventionFinalLegals } from "./components/email";
import { advices } from "./components/email/advices";

type CreateEmailVariable<P> = (params: P) => {
  subject: string;
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

const defaultSignature = `
    Bonne journée,
    L'équipe Immersion Facilitée
`;

export const templateByName: {
  [K in EmailType]: {
    niceName: string;
    createEmailVariables: CreateEmailVariable<
      Extract<TemplatedEmail, { type: K }>["params"]
    >;
    tags?: string[];
    attachmentUrls?: string[];
  };
} = {
  AGENCY_WAS_ACTIVATED: {
    niceName: "Activation agence",
    tags: ["activation prescripteur"],
    createEmailVariables: ({ agencyName, agencyLogoUrl }) => ({
      subject: `Immersion Facilitée - Votre structure a été activée`,
      greetings: "Bonjour,",
      content: `<strong>Votre structure prescriptrice d'immersion est activée !</strong> 

        Nous avons bien activé l'accès à la demande de convention dématérialisée pour des immersions professionnelles pour: ${agencyName}. 
        
        Merci à vous !`,
      agencyLogoUrl,
      subContent: defaultSignature,
    }),
  },
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: {
    niceName: "Confirmation bénéficiaire nouvelle convention",
    tags: ["demande signature bénéficiaire"],
    createEmailVariables: ({ firstName, lastName }) => ({
      subject:
        "Immersion Facilitée - Votre confirmation pour votre demande d'immersion est enregistrée",
      greetings: `Bonjour ${firstName} ${lastName},`,
      content: `
        Merci d'avoir confirmé votre demande d'immersion. Elle va être transmise à votre conseiller référent. 

        Il vous informera par mail de la validation ou non de l'immersion. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.`,
      highlight: `Attention, ne démarrez pas cette immersion tant que vous n'avez pas reçu cette validation !`,
      subContent: defaultSignature,
    }),
    attachmentUrls: [
      "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_beneficiaire.pdf",
    ],
  },
  NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION: {
    niceName: "Confirmation tuteur nouvelle convention",
    tags: ["confirmation tuteur enregistrée"],
    createEmailVariables: ({
      establishmentTutorName,
      beneficiaryFirstName,
      beneficiaryLastName,
    }) => ({
      subject:
        "Immersion Facilitée - Demande d'immersion professionnelle confirmée",
      greetings: `Bonjour ${establishmentTutorName},`,
      content: `
      Vous venez de confirmer la demande d'immersion professionnelle pour ${beneficiaryFirstName} ${beneficiaryLastName}  au sein de votre entreprise.      

      Cette demande va être transmise à son conseiller référent.
      Il vous informera prochainement par mail de la validation ou non de l'immersion. 
      `,
      highlight:
        "Attention, ne démarrez pas cette immersion tant que vous n'avez pas reçu la validation !",
      subContent: defaultSignature,
    }),
  },
  NEW_CONVENTION_AGENCY_NOTIFICATION: {
    niceName: "Notification agence nouvelle convention",
    tags: ["notification conseiller création demande d’immersion"],
    createEmailVariables: ({
      magicLink,
      dateStart,
      dateEnd,
      firstName,
      lastName,
      businessName,
      agencyName,
    }) => ({
      subject: `Immersion Facilitée - une demande de convention d'immersion est déposée : ${firstName}, ${lastName} - ${businessName} - ${agencyName}.`,
      greetings: "Bonjour,",
      content: `
      <strong>Une nouvelle demande d'immersion a été enregistrée.</strong>      ­

      Vous pouvez prendre connaissance de la demande en <a href="${magicLink}">cliquant ici</a>.
      <ul>
        <li>Vous pouvez dès maintenant demander des modifications ou la refuser si nécessaire.</li>
        <li>Vous ne pouvez pas la valider tant que le bénéficiaire et l'entreprise n'ont pas confirmé chacun leur accord pour cette demande.</li>
        <li>Vous avez connaissance du mail et du téléphone de chacun. Vous pouvez les relancer en cas de besoin.</li>
      </ul> 
      <strong>Dates de l'immersion :</strong> 
      - du ${dateStart}
      - au ${dateEnd}      

      <strong>Bénéficiaire :</strong> 
      ${firstName} ${lastName}      

      <strong>Entreprise :</strong>
      ${businessName}      

      <strong>Structure d'accompagnement :</strong>
      ${agencyName}
      `,
      subContent: defaultSignature,
    }),
    attachmentUrls: [
      "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_prescripteur.pdf",
    ],
  },
  VALIDATED_CONVENTION_FINAL_CONFIRMATION: {
    niceName: "Convention finale validée",
    tags: ["envoi convention"],
    createEmailVariables: ({
      beneficiaryFirstName,
      beneficiaryLastName,
      dateStart,
      dateEnd,
      businessName,
      establishmentTutorName,
      signature,
      beneficiaryRepresentativeName,
      establishmentRepresentativeName,
      beneficiaryCurrentEmployerName,
      immersionAddress,
      scheduleText,
      immersionActivities,
      immersionAppellationLabel,
      immersionSkills,
      workConditions,
      sanitaryPrevention,
      individualProtection,
    }) => ({
      subject: `Immersion Facilitée - Validation et convention de l'immersion pour observer l'activité de ${immersionAppellationLabel} au sein de ${businessName}`,
      greetings: "Bonjour,",
      content: `
      Bonne nouvelle ! 

      La demande faite par ${beneficiaryFirstName} ${beneficiaryLastName} pour réaliser une immersion du ${dateStart} au ${dateEnd}, au sein de ${businessName} et encadrée par ${establishmentTutorName} a été validée et la convention est bien enregistrée. 
      
      L'immersion peut donc démarrer aux dates convenues*.       
      
      À la fin de l'immersion, nous vous remercions de compléter la fiche d'évaluation de l'immersion <a href="https://immersion.cellar-c2.services.clever-cloud.com/bilan-immersion-professionnelle-inscriptible.pdf">à télécharger ici</a>, et de l'envoyer au conseiller qui a signé la convention (Pôle Emploi, Mission Locale…). Cette évaluation doit être complétée par le tuteur, si possible en présence du bénéficiaire de l'immersion.
      
      En cas de difficulté, prévenez au plus vite votre conseiller pour qu'il vous conseille au mieux.       
      ${defaultSignature}
      
      Vous trouverez ci-dessous la convention d'immersion :`,
      highlight: "Convention d'immersion professionnelle",
      subContent: `Cette convention est établie entre :
      - ${beneficiaryFirstName} ${beneficiaryLastName}
      - ${beneficiaryRepresentativeName}
      - ${beneficiaryCurrentEmployerName}
      - ${establishmentRepresentativeName}
      - ${signature}
      
      Toutes ces parties ont signé cette convention par le moyen d'une signature électronique, dans le cadre d'une téléprocédure créée par l'Etat. 
      
      Cette immersion se déroulera au sein de ${businessName}, à l'adresse suivante ${immersionAddress}.
      
      L'immersion se déroulera du du ${dateStart} au ${dateEnd}. 
      
      Les horaires de l'immersion seront :
      ${scheduleText}       
      
      L'immersion aura pour objectif de découvrir les activités nécessaires en lien avec le métier de ${immersionAppellationLabel}.
      
      Ces activités sont : ${immersionActivities}
      
      Les compétences et savoir-être observés sont : ${immersionSkills}.
      
      Cette immersion se déroulera dans les conditions réelles d'exercice de ce métier. 
      
      ${
        workConditions
          ? `Les conditions particulières d'exercice du métier sont : ${workConditions}`
          : ""
      }
      
      
      Encadrement : ${beneficiaryFirstName} ${beneficiaryLastName} sera encadré(e) par ${establishmentTutorName}.

      Dans le cadre de cette immersion,      
      - des mesures de prévention sanitaire sont prévues :      
      ${sanitaryPrevention}.
      - un équipement de protection est fourni : ${individualProtection}.
      
      ${beneficiaryFirstName} ${beneficiaryLastName}, ${beneficiaryRepresentativeName} et ${establishmentRepresentativeName} en signant cette convention, s'engagent à respecter les obligations réglementaires de la Période de Mise en Situation Professionnelle, rappelées ci-après.
      `,
      legals: defaultConventionFinalLegals,
    }),
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED: {
    niceName: "Notification de convention signée au conseiller pole-emploi lié",
    tags: ["immersion à étudier (mail conseiller)"],
    createEmailVariables: ({
      beneficiaryEmail,
      beneficiaryFirstName,
      beneficiaryLastName,
      businessName,
      advisorFirstName,
      advisorLastName,
      magicLink,
      dateEnd,
      dateStart,
      immersionAddress,
    }) => ({
      subject: `Immersion Facilitée - la demande de convention d'immersion envoyée par ${beneficiaryFirstName} ${beneficiaryLastName} est totalement signée. A vous de la valider !`,
      greetings: `Bonjour ${advisorFirstName} ${advisorLastName},`,
      content: `
      <strong>La demande d'immersion de ${beneficiaryFirstName} ${beneficiaryLastName} est signée. 
      A vous de l'étudier !</strong>`,
      button: {
        url: magicLink,
        label: "Voir la demande",
      },
      subContent: `
      Vous pouvez demander des modifications ou la refuser, si nécessaire  ou la valider si cette demande correspond au projet de ${beneficiaryFirstName} ${beneficiaryLastName}, ${beneficiaryEmail}.      
      
      N'hésitez pas à le joindre ou à appeler l'entreprise. Leurs coordonnées sont présentes dans la demande de convention.        
      
      <strong>Dates de l'immersion :</strong> 
      - du ${dateStart}
      - au ${dateEnd}
      
      <strong>Entreprise  d'accueil :</strong>
      - ${businessName}
      - ${immersionAddress}

      ${defaultSignature}
      `,
    }),
    attachmentUrls: [
      "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_prescripteur_pole_emploi.pdf",
    ],
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: {
    niceName:
      "Notification de nouvelle convention au conseiller pole-emploi lié",
    tags: [],
    createEmailVariables: ({
      advisorFirstName,
      advisorLastName,
      magicLink,
      dateStart,
      dateEnd,
      beneficiaryEmail,
      beneficiaryFirstName,
      beneficiaryLastName,
      businessName,
      immersionAddress,
    }) => ({
      subject: `Immersion Facilitée - une demande de convention d'immersion vous est directement adressée par: ${beneficiaryFirstName} ${beneficiaryLastName}`,
      greetings: `Bonjour ${advisorFirstName} ${advisorLastName},`,
      content: `
      <strong>Une nouvelle demande d'immersion a été enregistrée.</strong>

      Nous vous transmettons une demande de convention d'immersion (PMSMP) qui vient d'être faite par un demandeur d'emploi que vous suivez.

      <strong>Etape 1</strong> : Si le demandeur d’emploi n’est pas reconnu par CVM, procédez à son identification afin de pouvoir traiter le mail. Vous avez les informations à la fin de cet email. 
      Consultez la procédure à suivre pour clôturer cet email : <a href="https://drive.google.com/file/d/1tWL68ua1f-NgYnPkXs979_CkukPtlGRU/view?usp=sharing">Comment traiter un mail Immersion Facilitée dans CVM ?</a>

      <strong>Etape 2</strong> : <a href="${magicLink}">Vous pouvez y accéder en cliquant ici</a>      

      Tant que cette demande n'est pas encore confirmée par <strong>l'entreprise et par la/le bénéficiaire</strong>, vous pouvez demander des modifications ou la refuser, si nécessaire.

      <strong>La demande de modification et le refus sont à réaliser depuis l’écran Immersion Facilitée.</strong>

      Quand leur accord respectif sera enregistré, vous pourrez alors la valider. 

      Pensez à relancer celui qui n'a pas confirmé si son accord tarde à venir !  

      <strong>Ne répondez pas à ce mail, il ne sera ni adressé au bénéficiaire, ni à l’entreprise.</strong>

      Vous pouvez retrouver les coordonnées de chacun sur l’écran Immersion Facilitée.


      <strong>Résumé de la demande :</strong>      

      <strong>Dates de l'immersion :</strong>
      - du ${dateStart}
      - au ${dateEnd}     

      <strong>Demandeur d'emploi :</strong>
      - ${beneficiaryFirstName} ${beneficiaryLastName}
      - Courriel  : ${beneficiaryEmail}      

      <strong>Entreprise accueillant la PMSMP :</strong>
      - ${businessName}
      - ${immersionAddress}

      `,
      subContent: defaultSignature,
    }),
    attachmentUrls: [
      "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_prescripteur_pole_emploi.pdf",
    ],
  },
  REJECTED_CONVENTION_NOTIFICATION: {
    niceName: "Notification de convention rejetée",
    tags: ["refus demande d'immersion"],
    createEmailVariables: ({
      immersionProfession,
      beneficiaryFirstName,
      beneficiaryLastName,
      rejectionReason,
      agency,
      businessName,
      signature,
    }) => ({
      subject: `Immersion Facilitée - Refus de la demande d'immersion pour observer l'activité de ${immersionProfession} au sein de ${businessName}`,
      greetings: "Bonjour,",
      content: `
      Nous vous informons que la demande d'immersion professionnelle de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName} a été refusée par ${agency}.
      
      Les raisons en sont ${rejectionReason} par ${agency}.       
      
      Vous pouvez vous rapprocher de votre conseiller pour en échanger.      
      
      Bien cordialement,       
      ${signature} 
      `,
    }),
  },
  CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: {
    niceName: "Requête demande de modification de convention",
    tags: ["demande de modifications"],
    createEmailVariables: ({
      agency,
      justification,
      beneficiaryFirstName,
      beneficiaryLastName,
      businessName,
      magicLink,
      signature,
    }) => ({
      subject:
        "Immersion Facilitée - veuillez modifier cette demande d'immersion",
      greetings: "Bonjour,",
      content: `${agency} vous informe que la demande d'immersion de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName} nécessite d'être modifiée pour la raison suivante :
      ${justification}`,
      button: {
        url: magicLink,
        label: "Modifier votre demande",
      },
      subContent: `
      Après avoir corrigé votre demande, il vous faudra de nouveau confirmer votre accord. 
      
      Pensez à surveiller votre boite mail et à consulter vos spams si vous ne recevez pas le mail de demande de confirmation.      
      
      Bien cordialement,      
      ${signature}
      `,
    }),
  },
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
    niceName: "Examen de la convention",
    tags: ["notification conseiller demande d’immersion signée à valider"],
    createEmailVariables: ({
      beneficiaryFirstName,
      beneficiaryLastName,
      possibleRoleAction,
      businessName,
      magicLink,
    }) => ({
      subject: `Immersion Facilitée - Demande d'immersion à étudier: ${beneficiaryFirstName} ${beneficiaryLastName} - ${businessName}`,
      greetings: "Bonjour,",
      content: `
      <strong>Une nouvelle demande d'immersion a été enregistrée.</strong>

      Une demande d'immersion de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName} vous est envoyée pour que vous l'examiniez. 

      Nous vous remercions d'en prendre connaissance pour ${possibleRoleAction}.
      `,
      button: {
        label: "Examiner la demande",
        url: magicLink,
      },
      subContent: defaultSignature,
    }),
    attachmentUrls: [
      "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_prescripteur.pdf",
    ],
  },
  MAGIC_LINK_RENEWAL: {
    niceName: "Renouvellement de lien magique",
    tags: ["renouvellement de lien"],
    createEmailVariables: ({ magicLink }) => ({
      subject:
        "Immersion Facilitée - Voici votre nouveau lien magique pour accéder à la demande d'immersion",
      greetings: "Bonjour,",
      content: `
      Vous venez de demander le renouvellement d'un lien pour accéder à une demande d'immersion. Veuillez le trouver ci-dessous :
      `,
      button: {
        url: magicLink,
        label: "Voir ma demande d'immersion",
      },
      subContent: defaultSignature,
      highlight:
        "Si vous n'êtes pas à l'origine de cette demande, veuillez contacter notre équipe.",
    }),
  },
  BENEFICIARY_OR_ESTABLISHMENT_REPRESENTATIVE_ALREADY_SIGNED_NOTIFICATION: {
    niceName: "Notification de signature de l'autre signataire",
    tags: ["confirmation nécessaire après confirmation de l’autre partie"],
    createEmailVariables: ({
      beneficiaryFirstName,
      beneficiaryLastName,
      immersionProfession,
      businessName,
      establishmentRepresentativeName,
      existingSignatureName,
      magicLink,
    }) => ({
      subject:
        "Immersion Facilitée - À vous de confirmer votre demande de convention",
      greetings: "Bonjour,",
      content: `
      La demande de convention pour l'immersion de ${beneficiaryFirstName} ${beneficiaryLastName} pour le métier de ${immersionProfession} dans l'entreprise ${businessName} encadré par ${establishmentRepresentativeName} vient d'être signée par ${existingSignatureName}.

      <strong>À vous maintenant de la confirmer !</strong>
      `,
      button: {
        url: magicLink,
        label: "Confirmer ma demande de convention",
      },
      subContent: `
      Ensuite, il vous suffira d'attendre le mail de validation de l'organisme d'accompagnement.

      <strong>Attention, ne démarrez pas l'immersion sans ce mail de validation. Sinon, le risque “accident du travail” ne sera pas couvert.</strong>
      
      ${defaultSignature}
      `,
    }),
  },
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
    niceName: "Demande de signature pour confirmation de convention",
    tags: ["demande signature demande de convention"],
    createEmailVariables: ({
      signatoryName,
      beneficiaryName,
      businessName,
      establishmentRepresentativeName,
      beneficiaryRepresentativeName,
      beneficiaryCurrentEmployerName,
      magicLink,
    }) => ({
      subject: "Immersion Facilitée - Confirmez une demande d'immersion",
      greetings: `Bonjour ${signatoryName},`,
      content: `Une demande de convention d'immersion vient d'être enregistrée. Vous devez maintenant la confirmer.
        
        Pour rappel, cette demande concerne : 
           - Le bénéficiaire ${beneficiaryName}${
        beneficiaryRepresentativeName
          ? `\n- ${beneficiaryRepresentativeName}`
          : ""
      }${
        beneficiaryCurrentEmployerName
          ? `\n- L'employeur actuel du bénéficiare ${beneficiaryCurrentEmployerName}`
          : ""
      }
           - L'entreprise ${businessName}
           - Le tuteur dans l'entreprise ${establishmentRepresentativeName}
        
          <strong>Votre confirmation est obligatoire</strong> pour permettre à votre conseiller de valider la convention. Merci  !
        
        Vous devez maintenant confirmer votre demande.`,
      button: { url: magicLink, label: "Confirmer ma demande" },
      highlight:
        "Attention, ne démarrez pas votre immersion tant que vous n'avez pas reçu cette validation ! Vous n'auriez pas de couverture en cas d'accident.",
      subContent: `La décision de votre conseiller vous sera transmise par mail.

        ${defaultSignature}
      `,
    }),
    attachmentUrls: [
      "https://immersion.cellar-c2.services.clever-cloud.com/les_etapes_de_votre_demande.pdf",
    ],
  },
  CONTACT_BY_EMAIL_REQUEST: {
    niceName: "Mise en relation par mail",
    tags: ["mise en relation mail"],
    createEmailVariables: ({
      contactFirstName,
      contactLastName,
      potentialBeneficiaryEmail,
      potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName,
      jobLabel,
      businessName,
      message,
    }) => ({
      subject: `Immersion Facilitée - Un candidat vous contacte pour une demande d'immersion pour le métier de ${jobLabel}`,
      greetings: `Bonjour ${contactFirstName} ${contactLastName},`,
      content: `
      ${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName} cherche à vous contacter pour une demande d'immersion. 

      L'immersion souhaitée porte sur le métier de ${jobLabel} dans votre entreprise ${businessName}

      <strong>Voici son message :</strong>
      ${message}

      Vous pouvez le joindre par mail : ${potentialBeneficiaryEmail}

      <strong>Les points essentiels pour étudier une demande d'immersion professionnelle&nbsp:</strong>
      - Vérifiez avec qu'elle/il est bien suivi/e par un conseiller emploi (ex: Pôle emploi, Mission Locale, Cap Emploi, Chargé d'Insertion Professionnelle) ou un conseiller en évolution professionnelle.
      - Échangez sur vos objectifs réciproques, vos besoins, votre calendrier possible.
      - Il est possible de faire une immersion pour découvrir un métier, confirmer un projet professionnel ou initier un recrutement. 
      - Une immersion se fait en général pendant une à deux semaines et ne peut jamais dépasser un mois. 
      - Ce n'est pas un stage d'application fait pendant une formation. 
      - Si vous mettez d'accord, complétez la demande de convention. Elle sera adressée automatiquement à la structure d'accompagnement du bénéficiaire.
      - Vous souhaitez suspendre votre visibilité sur la plateforme, le temps d'étudier sereinement cette demande ? Cliquer sur <a href="https://immersion-facile.beta.gouv.fr/">“modifier votre entreprise”</a>.

      Voici quelques conseils pour préparer ce premier échange :
      `,
      button: {
        url: "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_entreprise.pdf",
        label: "Nos bons conseils",
      },
      subContent: defaultSignature,
    }),
  },
  CONTACT_BY_PHONE_INSTRUCTIONS: {
    niceName: "Instructions de mise en contact par téléphone",
    tags: ["mise en relation tel"],
    createEmailVariables: ({
      businessName,
      contactFirstName,
      contactLastName,
      contactPhone,
      potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName,
    }) => ({
      subject: `Immersion Facilitée - Coordonnées téléphoniques pour faire votre demande d'immersion`,
      greetings: `Bonjour ${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName},`,
      content: `
      Vous avez manifesté de l’intérêt pour réaliser une immersion professionnelle au sein de l’entreprise ${businessName}.
      Cette entreprise a souhaité être contactée par téléphone.

      Voici ses coordonnées :
      - Personne à contacter : ${contactFirstName} ${contactLastName}
      - Numéro de téléphone  :  ${contactPhone}      
      
      Ces informations sont personnelles et confidentielles. Elles ne peuvent pas être communiquées à d’autres personnes. 
      Merci !

      ${advices}
      `,
    }),
  },
  CONTACT_IN_PERSON_INSTRUCTIONS: {
    niceName: "Instructions de mise en contact en personne",
    tags: ["mise en relation en personne"],
    createEmailVariables: ({
      potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName,
      contactFirstName,
      contactLastName,
      businessAddress,
      businessName,
    }) => ({
      subject:
        "Immersion Facilitée - Coordonnées de l'entreprise pour faire votre demande d'immersion",
      greetings: `Bonjour ${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName},`,
      content: `Vous avez manifesté de l’intérêt pour réaliser une immersion professionnelle au sein de l’entreprise ${businessName}.

    Cette entreprise souhaite que vous vous rendiez sur place pour présenter votre demande. 

    Voici les coordonnées :
    - Personne à contacter : <strong>${contactFirstName} ${contactLastName}</strong>
    - Adresse de l'entreprise : <strong>${businessAddress}</strong>
    `,
      highlight:
        "Ces informations sont personnelles et confidentielles. Elles ne peuvent pas être communiquées à d’autres personnes. ",
      subContent: defaultSignature,
    }),
  },
  SHARE_DRAFT_CONVENTION_BY_LINK: {
    niceName: "Partager le formulaire de convention par lien",
    tags: ["partage de convention"],
    createEmailVariables: ({ additionalDetails, conventionFormUrl }) => ({
      subject:
        "Immersion Facilitée - Une demande de convention préremplie vous est transmise pour que vous la complétiez",
      greetings: "Bonjour,",
      content: `
        <strong>Une demande de convention d'immersion doit être complétée :</strong>
        ${additionalDetails}
      `,
      button: {
        label: "Compléter la demande",
        url: conventionFormUrl,
      },
      subContent: defaultSignature,
    }),
  },
  SUGGEST_EDIT_FORM_ESTABLISHMENT: {
    niceName: "[KO] Suggestion de mise à jour d'etablissement",
    tags: ["mise à jour fiche entreprise"],
    createEmailVariables: () => ({
      subject: "TODO",
      content: "TODO",
    }),
  },
  EDIT_FORM_ESTABLISHMENT_LINK: {
    niceName: "Lien d'édition du formulaire d'établissement",
    tags: ["modification établissement"],
    createEmailVariables: ({ editFrontUrl }) => ({
      subject:
        "Immersion Facilitée - Modification de la fiche de votre entreprise",
      greetings: "Bonjour,",
      content: `
      Vous avez demandé à modifier les informations concernant votre entreprise. 

      Vous pouvez ajouter ou supprimer des métiers, modifier l'adresse de l'entreprise,  les coordonnées du référent “Immersion” dans votre entreprise ou le mode de contact souhaité, etc.  
      `,
      button: {
        label: "Modifier ma fiche entreprise",
        url: editFrontUrl,
      },
      highlight: `Si vous n'êtes pas à l'origine de cette demande, nous vous recommandons de nous contacter rapidement par mail : contact@immersion-facile.beta.gouv.fr.`,
      subContent: defaultSignature,
    }),
  },
  NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: {
    niceName: "Contact enregistré de création d'un nouveau établissement",
    tags: ["confirmation enregistrement entreprise"],
    createEmailVariables: ({
      businessName,
      contactFirstName,
      contactLastName,
    }) => ({
      subject: `Immersion Facilitée - Confirmation de création de votre établissement ${businessName} pour accueillir des immersions`,
      greetings: "Bonjour,",
      content: `
      <strong>Félicitations !</strong>

      Vous venez d'enregistrer votre établissement ${businessName} pour accueillir des immersions professionnelles.      

      ${contactFirstName} ${contactLastName} recevra bien les demandes d'immersion.      

      Pour ces demandes, il n'est pas utile de demander un CV. Il s'agit seulement de passer quelques jours ensemble pour une découverte réciproque. 

      Si vous avez des projets de recrutement et si, grâce à une immersion, vous retenez un profil qui vous convient, un conseiller emploi vous proposera, si nécessaire,  un plan de formation sur mesure. 

      Merci d'avoir rejoint la communauté des “entreprises s'engagent” et de contribuer ainsi à l'accès à l'emploi de tous les publics.
      `,
      subContent: defaultSignature,
      button: {
        label: "Nos bons conseils",
        url: "https://immersion.cellar-c2.services.clever-cloud.com/livret_accueil_entreprise.pdf",
      },
    }),
  },
  CREATE_IMMERSION_ASSESSMENT: {
    niceName: "Lien de creation du bilan",
    tags: ["notification entreprise fin de l’immersion"],
    createEmailVariables: ({
      establishmentTutorName,
      beneficiaryFirstName,
      beneficiaryLastName,
      immersionAssessmentCreationLink,
    }) => ({
      subject: "Immersion Facilitée - Comment s'est déroulée l'immersion ?",
      greetings: `Bonjour ${establishmentTutorName},`,
      content: `
      L'immersion  professionnelle de ${beneficiaryFirstName} ${beneficiaryLastName} au sein de votre entreprise est en passe de s'achever. 

      Nous vous remercions de votre accueil. 

      Pouvez-vous indiquer si cette immersion s'est bien déroulée jusqu'à sa date de fin prévue ?`,
      button: {
        label: "Evaluer cette immersion",
        url: immersionAssessmentCreationLink,
      },
      subContent: `
      Cette information est importante pour la suite de son parcours professionnel. 

      N'oubliez pas non plus de compléter avec ${beneficiaryFirstName} ${beneficiaryLastName} le <a href="https://immersion.cellar-c2.services.clever-cloud.com/0a57f38d-1dbe-4eb4-8835-9b8fc48a13d8.pdf">bilan de l'immersion en PDF</a>. 

      Merci  !      
      ${defaultSignature}
      `,
    }),
  },
  FULL_PREVIEW_EMAIL: {
    niceName: "Preview email complet (tous les blocs)",
    tags: ["aperçu pour tests"],
    createEmailVariables: ({ beneficiaryName }) => ({
      subject: "Test contenant toutes les blocs email",
      greetings: `Bonjour ${beneficiaryName}`,
      content: `Merci d'avoir confirmé votre demande d'immersion. Elle va être transmise à votre conseiller référent.
      
      Il vous informera par mail de la validation ou non de l'immersion. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.`,
      legals: defaultConventionFinalLegals,
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
  SIGNEE_HAS_SIGNED_CONVENTION: {
    niceName: "Confirmation de signature de l'immersion",
    createEmailVariables: ({ demandeId, signedAt }) => ({
      subject: `Immersion Facilitée - Confirmation de signature de l'immersion - ${demandeId}`,
      greetings: `Bonjour,`,
      content: `
      Nous confirmons que vous avez signé la convention d'immersion professionnelle ${demandeId} le ${
        isStringDate(signedAt)
          ? toDisplayedDate(new Date(signedAt), true)
          : "DATE INVALIDE"
      }.
      `,
      highlight: `
      Attention. Votre convention est en cours d'examen.
      Avant de débuter l'immersion, veuillez vous assurer que la convention a bien été validée par un conseiller.
      Vous recevrez une notification lorsque ce sera fait.
      `,
      subContent: defaultSignature,
    }),
    tags: ["confirmation de signature de convention"],
  },
};
