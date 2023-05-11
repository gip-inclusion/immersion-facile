import { createTemplatesByName, EmailButtonProps } from "html-templates";
import { InternshipKind } from "../convention/convention.dto";
import { isStringDate, toDisplayedDate } from "../utils/date";
import { advices } from "./advices";
import { defaultConventionFinalLegals } from "./defaultConventionFinalLegals";
import { EmailParamsByEmailType } from "./EmailParamsByEmailType";
import { immersionFacileContactEmail } from "./knownEmailsAddresses";

const defaultSignature = (internshipKind: InternshipKind) =>
  internshipKind === "immersion"
    ? `
    Bonne journée,
    L'équipe Immersion Facilitée
`
    : `
    Bonne journée, 
    L’équipe du Point Orientation Apprentissage
`;

const createConventionStatusButton = (link: string): EmailButtonProps => ({
  url: link,
  label: "Voir l'état de ma demande",
  target: "_blank",
});

// to add a new EmailType, or changes the params of one, edit first EmailParamsByEmailType and let types guide you
export const templatesByName = createTemplatesByName<EmailParamsByEmailType>({
  SIGNATORY_FIRST_REMINDER: {
    niceName: "Signataire - Premier rappel",
    tags: ["relance signatures manquantes"],
    createEmailVariables: ({
      actorFirstName,
      actorLastName,
      beneficiaryFirstName,
      beneficiaryLastName,
      businessName,
      signatoriesSummary,
      magicLinkUrl,
    }) => ({
      subject:
        "RAPPEL - La convention démarrant d'ici 3 jours n'est pas complètement signée",
      greetings: `Bonjour ${actorFirstName} ${actorLastName},`,
      content: `
      Certains signataires n'ont pas encore signé la demande de convention d'immersion en milieu professionnel pour ${beneficiaryFirstName} ${beneficiaryLastName}.
      
      Voici, à date, l'état des signatures :
      ${signatoriesSummary}

      <strong>Sans toutes les signatures, la convention ne peut être établie et l'établissement ${businessName} ne pourra pas accueillir en immersion ${beneficiaryFirstName} ${beneficiaryLastName}.</strong>

      Nous vous remercions de confirmer au plus vite cette demande.`,
      buttons: magicLinkUrl && [
        {
          label: "Ouvrir la demande de convention",
          url: `${magicLinkUrl}`,
        },
      ],
      subContent: `Bonne journée,
      L'équipe Immersion Facilitée`,
    }),
  },
  SIGNATORY_LAST_REMINDER: {
    niceName: "Signataire - Dernier rappel",
    tags: ["relance signatures manquantes"],
    createEmailVariables: ({
      actorFirstName,
      actorLastName,
      beneficiaryFirstName,
      beneficiaryLastName,
      businessName,
      signatoriesSummary,
      magicLinkUrl,
    }) => ({
      subject:
        "RAPPEL URGENT - La convention démarrant dans moins de 24h n'est pas complètement signée",
      greetings: `Bonjour ${actorFirstName} ${actorLastName},`,
      content: `
      Certains signataires n'ont pas encore signé la demande de convention d'immersion en milieu professionnel pour ${beneficiaryFirstName} ${beneficiaryLastName}.
      
      Voici, à date, l'état des signatures :
      ${signatoriesSummary}

      <strong>Sans toutes les signatures, la convention ne peut être établie et l'établissement ${businessName} ne pourra pas accueillir en immersion ${beneficiaryFirstName} ${beneficiaryLastName}.</strong>

      Nous vous remercions de confirmer au plus vite cette demande.`,
      buttons: magicLinkUrl && [
        {
          label: "Ouvrir la demande de convention",
          url: `${magicLinkUrl}`,
        },
      ],
      subContent: `Bonne journée,
      L'équipe Immersion Facilitée`,
    }),
  },
  AGENCY_FIRST_REMINDER: {
    niceName: "Agence - Premier rappel",
    tags: ["relance vérification manquante"],
    createEmailVariables: ({
      agencyMagicLinkUrl,
      beneficiaryFirstName,
      beneficiaryLastName,
      businessName,
      agencyName,
      dateStart,
      dateEnd,
    }) => ({
      subject:
        "RAPPEL - Une demande de convention d'immersion démarrant d'ici 3 jours ouvrés doit être vérifiée",
      greetings: "Bonjour,",
      content: `
      Merci de ne pas oublier de traiter la demande de convention d'immersion qui concerne :

      Bénéficiaire : ${beneficiaryFirstName} ${beneficiaryLastName}

      Entreprise : ${businessName}

      Structure d'accompagnement : ${agencyName}

      Dates de l'immersion :
      - du ${dateStart}
      - au ${dateEnd}

      Cette demande d'immersion a bien été signée par le bénéficiaire et l'entreprise d'accueil.`,
      buttons: [
        {
          label: "Voir la convention",
          url: agencyMagicLinkUrl,
        },
      ],
      subContent: `Bonne journée,
      L'équipe Immersion Facilitée`,
    }),
  },
  AGENCY_LAST_REMINDER: {
    niceName: "Agence - Dernier rappel",
    tags: ["relance vérification manquante"],
    createEmailVariables: ({
      agencyMagicLinkUrl,
      beneficiaryFirstName,
      beneficiaryLastName,
      businessName,
    }) => ({
      subject:
        "RAPPEL URGENT - Une demande de convention d'immersion démarrant demain doit être vérifiée",
      greetings: "Urgent !",
      content: `
      L'immersion demandée par Bénéficiaire <strong>${beneficiaryFirstName} ${beneficiaryLastName}</strong> au sein de l'entreprise <strong>${businessName}</strong> doit démarrer demain.

      Nous vous remercions d'examiner rapidement la demande de convention qui vous a été envoyée afin que votre décision soit transmise au bénéficiaire et à l'entreprise.`,
      buttons: [
        {
          label: "Voir la convention",
          url: agencyMagicLinkUrl,
        },
      ],
      subContent: `
      Pour rappel, nous vous transmettons tous les renseignements nécessaires pour examiner la demande. Si vous la validez, la convention est automatiquement établie.

      Bonne journée,
      L'équipe Immersion Facilitée
      `,
    }),
  },
  AGENCY_WAS_ACTIVATED: {
    niceName: "Activation agence",
    tags: ["activation prescripteur"],
    createEmailVariables: ({ agencyLogoUrl, agencyName }) => ({
      subject: `Immersion Facilitée - Votre structure a été activée`,
      greetings: "Bonjour,",
      content: `<strong>Votre structure prescriptrice d'immersion est activée !</strong> 

        Nous avons bien activé l'accès à la demande de convention dématérialisée pour des immersions professionnelles pour: ${agencyName}. 
        
        Merci à vous !`,
      agencyLogoUrl,
      subContent: defaultSignature("immersion"),
    }),
  },
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: {
    niceName: "Confirmation bénéficiaire nouvelle convention",
    tags: ["demande signature bénéficiaire"],
    createEmailVariables: ({
      firstName,
      lastName,
      internshipKind,
      conventionId,
      agencyLogoUrl,
    }) => ({
      subject: `${
        internshipKind === "immersion"
          ? "Votre confirmation pour votre demande de convention est enregistrée"
          : "Mini Stage - Votre confirmation pour votre demande de mini stage est enregistrée"
      }`,
      greetings: `Bonjour ${firstName} ${lastName},`,
      content: `
        Merci d'avoir confirmé votre demande de convention. Elle va être transmise à votre conseiller référent.
        La convention est enregistrée avec le numéro: ${conventionId}.

        Il vous informera par mail de la validation ou non ${
          internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
        }. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.`,
      highlight: {
        content: `Attention, ne démarrez pas ${
          internshipKind === "immersion" ? "cette immersion" : "ce mini stage"
        } tant que vous n'avez pas reçu cette validation !`,
      },
      subContent: defaultSignature(internshipKind),
      attachmentUrls:
        internshipKind === "immersion"
          ? [
              "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_beneficiaire.pdf",
            ]
          : undefined,
      agencyLogoUrl,
    }),
  },
  NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION: {
    niceName: "Confirmation tuteur nouvelle convention",
    tags: ["confirmation tuteur enregistrée"],
    createEmailVariables: ({
      establishmentTutorName,
      beneficiaryFirstName,
      beneficiaryLastName,
      internshipKind,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      conventionId,
      agencyLogoUrl,
    }) => ({
      subject: `${
        internshipKind === "immersion"
          ? "Demande de convention confirmée"
          : "Mini Stage - Demande de mini stage confirmée"
      }`,
      greetings: `Bonjour ${establishmentTutorName},`,
      content: `
      Vous venez de confirmer la demande ${
        internshipKind === "immersion"
          ? "d'immersion professionnelle"
          : "de mini stage"
      } pour ${beneficiaryFirstName} ${beneficiaryLastName}  au sein de votre entreprise.      

      Cette demande va être transmise à son ${
        internshipKind === "immersion"
          ? "conseiller référent"
          : "conseiller de la Chambre de Commerce et d'Instrustrie - CCI"
      }.
      Il vous informera prochainement par mail de la validation ou non ${
        internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
      }. 
      `,
      highlight: {
        content: `Attention, ne démarrez pas ${
          internshipKind === "immersion" ? "cette immersion" : "ce mini stage"
        } tant que vous n'avez pas reçu la validation !`,
      },
      subContent: defaultSignature(internshipKind),
      agencyLogoUrl,
    }),
  },
  NEW_CONVENTION_AGENCY_NOTIFICATION: {
    niceName: "Notification agence nouvelle convention",
    tags: ["notification conseiller création demande d’immersion"],
    createEmailVariables: ({
      magicLink,
      conventionStatusLink,
      dateStart,
      dateEnd,
      firstName,
      lastName,
      businessName,
      agencyName,
      internshipKind,
      warning,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      conventionId,
      agencyLogoUrl,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? `Une demande de convention d'immersion est déposée : ${firstName}, ${lastName} - ${businessName} - ${agencyName}.`
          : `Mini Stage - une demande de convention de mini stage est déposée : ${firstName}, ${lastName} - ${businessName} - ${agencyName}.`,
      greetings: "Bonjour,",
      content: `
      <strong>Une nouvelle demande ${
        internshipKind === "immersion"
          ? "d'immersion professionnelle"
          : "de mini stage"
      } a été enregistrée.</strong>

      

      Vous pouvez prendre connaissance de la demande en <a href="${magicLink}" target="_blank">cliquant ici</a>.
      Vous pouvez également suivre <a href="${conventionStatusLink}" target="_blank">l'état de la convention en cliquant ici</a>.
      <ul>
        <li>Vous pouvez dès maintenant demander des modifications ou la refuser si nécessaire.</li>
        <li>Vous ne pouvez pas la valider tant que le bénéficiaire et l'entreprise n'ont pas confirmé chacun leur accord pour cette demande.</li>
        <li>Vous avez connaissance du mail et du téléphone de chacun. Vous pouvez les relancer en cas de besoin.</li>
      </ul> 
      <strong>Dates ${
        internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
      } :</strong> 
      - du ${dateStart}
      - au ${dateEnd}      

      <strong>Bénéficiaire :</strong> 
      ${firstName} ${lastName}      

      <strong>Entreprise :</strong>
      ${businessName}      

      <strong>Structure d'accompagnement :</strong>
      ${agencyName}
      `,
      highlight: {
        content: warning,
      },
      subContent: defaultSignature(internshipKind),
      attachmentUrls:
        internshipKind === "immersion"
          ? [
              "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_prescripteur.pdf",
            ]
          : undefined,
      agencyLogoUrl,
    }),
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
      emergencyContactInfos,
      establishmentTutorName,
      immersionAppellationLabel,
      beneficiaryBirthdate,
      internshipKind,
      agencyLogoUrl,
      magicLink,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? `Validation et convention de l'immersion pour observer l'activité de ${immersionAppellationLabel} au sein de ${businessName}`
          : `Mini Stage - Validation et convention du mini stage pour observer l'activité de ${immersionAppellationLabel} au sein de ${businessName}`,
      greetings: "Bonjour,",
      content: `
      Bonne nouvelle ! 

      La demande faite par ${beneficiaryFirstName} ${beneficiaryLastName} (né le ${
        isStringDate(beneficiaryBirthdate)
          ? toDisplayedDate(new Date(beneficiaryBirthdate))
          : "Date invalide"
      }) pour réaliser une immersion du ${dateStart} au ${dateEnd}, au sein de ${businessName} et encadrée par ${establishmentTutorName} a été validée et la convention est bien enregistrée. 
      
      ${
        internshipKind === "immersion" ? "L'immersion" : "Le mini stage"
      } peut donc démarrer aux dates convenues.       
      `,
      buttons: [
        {
          label:
            internshipKind === "immersion"
              ? "Voir la convention d'immersion"
              : "Voir la convention du mini-stage",
          url: magicLink,
        },
      ],
      subContent: `
      ${
        internshipKind === "immersion"
          ? `À la fin de l'immersion, nous vous remercions de compléter la fiche d'évaluation de l'immersion <a href="https://immersion.cellar-c2.services.clever-cloud.com/bilan-immersion-professionnelle-inscriptible.pdf" target="_blank">à télécharger ici</a>, et de l'envoyer au conseiller qui a signé la convention (Pôle Emploi, Mission Locale…). Cette évaluation doit être complétée par le tuteur, si possible en présence du bénéficiaire de l'immersion.`
          : `À la fin du mini stage, nous vous remercions de compléter la fiche d'évaluation du mini stage <a href="https://immersion.cellar-c2.services.clever-cloud.com/CCI_MiniStage_Bilan.pdf" target="_blank">à télécharger ici</a>, et de l'envoyer au conseiller de la Chambre de Commerce et d'Instrustrie - CCI qui a signé la convention. Cette évaluation doit être complétée par le tuteur, si possible en présence du bénéficiaire du mini stage.`
      }
            
      ${defaultSignature(internshipKind)}


      En cas de difficulté, prévenez au plus vite votre ${
        internshipKind === "immersion"
          ? "conseiller"
          : "conseiller de la Chambre de Commerce et d'Instrustrie - CCI"
      } pour qu'il vous conseille au mieux. 
      
      ${
        emergencyContactInfos
          ? `Si la situation l'impose, le contact d'urgence de ${beneficiaryFirstName} ${beneficiaryLastName} : ${emergencyContactInfos}`
          : ""
      }`,
      agencyLogoUrl,
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
      agencyLogoUrl,
    }) => ({
      subject: `Pour action : la demande de convention d'immersion envoyée par ${beneficiaryFirstName} ${beneficiaryLastName} est totalement signée. À vous de la valider !`,
      greetings: `Bonjour ${advisorFirstName} ${advisorLastName},`,
      content: `
      <strong>La demande d'immersion de ${beneficiaryFirstName} ${beneficiaryLastName} est signée. 
      À vous de l'étudier !</strong>`,
      buttons: [
        {
          url: magicLink,
          label: "Voir la demande",
          target: "_blank",
        },
      ],
      subContent: `
      Vous pouvez demander des modifications ou la refuser, si nécessaire  ou la valider si cette demande correspond au projet de ${beneficiaryFirstName} ${beneficiaryLastName}, ${beneficiaryEmail}.      
      
      N'hésitez pas à le joindre ou à appeler l'entreprise. Leurs coordonnées sont présentes dans la demande de convention.        
      
      <strong>Dates de l'immersion :</strong> 
      - du ${dateStart}
      - au ${dateEnd}
      
      <strong>Entreprise d'accueil :</strong>
      - ${businessName}
      - ${immersionAddress}

      ${defaultSignature("immersion")}
      `,
      attachmentUrls: [
        "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_prescripteur_pole_emploi.pdf",
      ],
      agencyLogoUrl,
    }),
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
      agencyLogoUrl,
    }) => ({
      subject: `Une demande de convention d'immersion vous est directement adressée par: ${beneficiaryFirstName} ${beneficiaryLastName}`,
      greetings: `Bonjour ${advisorFirstName} ${advisorLastName},`,
      content: `
      <strong>Une nouvelle demande d'immersion a été enregistrée.</strong>

      Nous vous transmettons une demande de convention d'immersion (PMSMP) qui vient d'être faite par un demandeur d'emploi que vous suivez.

      <strong>Etape 1</strong> : Si le demandeur d’emploi n’est pas reconnu par CVM, procédez à son identification afin de pouvoir traiter le mail. Vous avez les informations à la fin de cet email. 
      Consultez la procédure à suivre pour clôturer cet email : <a href="https://drive.google.com/file/d/1tWL68ua1f-NgYnPkXs979_CkukPtlGRU/view?usp=sharing">Comment traiter un mail Immersion Facilitée dans CVM ?</a>

      <strong>Etape 2</strong> : <a href="${magicLink}" target="_blank">Vous pouvez y accéder en cliquant ici</a>      

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
      subContent: defaultSignature("immersion"),
      attachmentUrls: [
        "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_prescripteur_pole_emploi.pdf",
      ],
      agencyLogoUrl,
    }),
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
      internshipKind,
      agencyLogoUrl,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? `Refus de la demande d'immersion pour observer l'activité de ${immersionProfession} au sein de ${businessName}`
          : `Mini Stage - Refus de la demande de mini stage pour l'activité de ${immersionProfession} au sein de ${businessName}`,
      greetings: "Bonjour,",
      content: `
      Nous vous informons que la demande ${
        internshipKind === "immersion"
          ? "d'immersion professionnelle"
          : "de mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName} a été refusée par ${agency}.
      
      Les raisons en sont ${rejectionReason} par ${agency}.       
      
      Vous pouvez vous rapprocher de votre conseiller${
        internshipKind === "immersion"
          ? ""
          : " de la chambre de commerce et d'instrustrie - CCI"
      } pour en échanger.      
      
      Bien cordialement,       
      ${signature} 
      `,
      agencyLogoUrl,
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
      conventionStatusLink,
      signature,
      internshipKind,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      immersionAppellation,
      agencyLogoUrl,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? "Pour action : veuillez modifier cette demande d'immersion professionnelle"
          : "Pour action : mini Stage - veuillez modifier cette demande de mini stage",
      greetings: "Bonjour,",
      content: `${agency} vous informe que la demande ${
        internshipKind === "immersion" ? "d'immersion" : "de mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName} nécessite d'être modifiée pour la raison suivante :
      ${justification}`,
      buttons: [
        {
          url: magicLink,
          label: "Modifier votre demande",
        },
        createConventionStatusButton(conventionStatusLink),
      ],
      subContent: `
      Après avoir corrigé votre demande, il vous faudra de nouveau confirmer votre accord. 
      
      Pensez à surveiller votre boite mail et à consulter vos spams si vous ne recevez pas le mail de demande de confirmation.      
      
      Bien cordialement,      
      ${signature}
      `,
      agencyLogoUrl,
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
      conventionStatusLink,
      internshipKind,
      agencyLogoUrl,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? `Demande d'immersion à étudier: ${beneficiaryFirstName} ${beneficiaryLastName} - ${businessName}`
          : `Mini Stage - Demande de mini stage à étudier: ${beneficiaryFirstName} ${beneficiaryLastName} - ${businessName}`,
      greetings: "Bonjour,",
      content: `
      <strong>Une nouvelle demande ${
        internshipKind === "immersion" ? "d'immersion" : "de mini stage"
      } a été enregistrée.</strong>

      Une demande ${
        internshipKind === "immersion" ? "d'immersion" : "de mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName} vous est envoyée pour que vous l'examiniez. 

      Nous vous remercions d'en prendre connaissance pour ${possibleRoleAction}.
      `,
      buttons: [
        {
          label: "Examiner la demande",
          url: magicLink,
          target: "_blank",
        },
        createConventionStatusButton(conventionStatusLink),
      ],
      subContent: defaultSignature(internshipKind),
      attachmentUrls:
        internshipKind === "immersion"
          ? [
              "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_prescripteur.pdf",
            ]
          : undefined,
      agencyLogoUrl,
    }),
  },
  MAGIC_LINK_RENEWAL: {
    niceName: "Renouvellement de lien magique",
    tags: ["renouvellement de lien"],
    createEmailVariables: ({
      magicLink,
      conventionStatusLink,
      internshipKind,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? "Voici votre nouveau lien magique pour accéder à la demande d'immersion"
          : `Mini Stage - Voici votre nouveau lien magique pour accéder à la demande de mini stage`,
      greetings: "Bonjour,",
      content: `
      Vous venez de demander le renouvellement d'un lien pour accéder à une demande ${
        internshipKind === "immersion" ? "d'immersion" : "de mini stage"
      }. Veuillez le trouver ci-dessous :
      `,
      buttons: [
        {
          url: magicLink,
          label: "Mon lien renouvelé",
        },
        createConventionStatusButton(conventionStatusLink),
      ],
      subContent: defaultSignature(internshipKind),
      highlight: {
        content:
          "Si vous n'êtes pas à l'origine de cette demande, veuillez contacter notre équipe.",
      },
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
      conventionStatusLink,
      internshipKind,
      agencyLogoUrl,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? "Pour action : à vous de signer votre demande de convention"
          : "Pour action : à vous de confirmer votre demande de mini stage",
      greetings: "Bonjour,",
      content: `
      La demande de convention pour ${
        internshipKind === "immersion" ? "l'immersion" : "le mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} pour le métier de ${immersionProfession} dans l'entreprise ${businessName} encadré par ${establishmentRepresentativeName} vient d'être signée par ${existingSignatureName}.

      <strong>Ouvrez la demande via le bouton ci-dessous puis vérifiez les informations :</strong>
        - Si les informations sont correctes, cochez la case "Je soussigné..." tout en bas du formulaire et cliquez sur le bouton "Confirmer et signer".
        - Si les informations ne sont pas correctes, cliquez sur le bouton "Annuler les signatures et demander des modifications".
      `,
      buttons: [
        { url: magicLink, label: "Ouvrir ma demande" },
        createConventionStatusButton(conventionStatusLink),
      ],
      subContent: `
      Ensuite, il vous suffira d'attendre le mail de validation de l'organisme d'accompagnement.

      <strong>Attention, ne démarrez pas ${
        internshipKind === "immersion" ? "l'immersion" : "le mini stage"
      } sans ce mail de validation. Sinon, le risque “accident du travail” ne sera pas couvert.</strong>
      
      ${defaultSignature(internshipKind)}
      `,
      agencyLogoUrl,
    }),
  },
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
    niceName: "Demande de signature pour confirmation de convention",
    tags: ["demande signature demande de convention"],
    createEmailVariables: ({
      signatoryName,
      beneficiaryName,
      businessName,
      establishmentTutorName,
      establishmentRepresentativeName,
      beneficiaryRepresentativeName,
      beneficiaryCurrentEmployerName,
      magicLink,
      conventionStatusLink,
      internshipKind,
      agencyLogoUrl,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? "Pour action : signez votre demande de convention"
          : "Pour action : signez votre demande de mini stage",
      greetings: `Bonjour ${signatoryName},`,
      content: `Une demande de convention ${
        internshipKind === "immersion" ? "d'immersion" : "de mini stage"
      } vient d'être enregistrée. Vous devez maintenant la confirmer.
        
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
           - L'entreprise ${businessName} représentée par ${establishmentRepresentativeName}
           - Le tuteur dans l'entreprise ${establishmentTutorName}
        
          <strong>Votre signature est obligatoire</strong> pour permettre à votre ${
            internshipKind === "immersion"
              ? "conseiller"
              : "conseiller de la Chambre de Commerce et d'Instrustrie - CCI"
          } de valider la convention. Merci !
        
        <strong>Ouvrez la demande via le bouton ci-dessous puis vérifiez les informations :</strong>
        - Si les informations sont correctes, cochez la case "Je soussigné..." tout en bas du formulaire et cliquez sur le bouton "Confirmer et signer".
        - Si les informations ne sont pas correctes, cliquez sur le bouton "Annuler les signatures et demander des modifications".`,
      buttons: [
        { url: magicLink, label: "Ouvrir ma demande" },
        createConventionStatusButton(conventionStatusLink),
      ],
      highlight: {
        content: `Attention, ne démarrez pas votre ${
          internshipKind === "immersion" ? "immersion" : "mini stage"
        } tant que vous n'avez pas reçu cette validation ! Vous n'auriez pas de couverture en cas d'accident.`,
      },
      subContent: `La décision de votre ${
        internshipKind === "immersion"
          ? "conseiller"
          : "conseiller de la Chambre de Commerce et d'Instrustrie - CCI"
      } vous sera transmise par mail.

        ${defaultSignature(internshipKind)}
      `,
      attachmentUrls:
        internshipKind === "immersion"
          ? [
              "https://immersion.cellar-c2.services.clever-cloud.com/les_etapes_de_votre_demande.pdf",
            ]
          : undefined,
      agencyLogoUrl,
    }),
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
      appellationLabel,
      businessName,
      message,
    }) => ({
      subject: `${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName} vous contacte pour une demande d'immersion sur le métier de ${appellationLabel}`,
      greetings: `Bonjour ${contactFirstName} ${contactLastName},`,
      content: `
      ${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName} vous écrit :
      ${message}

      L'immersion souhaitée porte sur le métier de ${appellationLabel} dans votre entreprise ${businessName}.

      <strong>Sa candidature vous intéresse ? Voici les étapes à suivre :</strong>
      - Préparez votre échange grâce à notre <a href="https://aide.immersion-facile.beta.gouv.fr/fr/article/etudier-une-demande-dimmersion-professionnelle-1ehkehm/">page d'aide</a>.
      - Prenez contact avec le candidat : <a href="mailto:${potentialBeneficiaryEmail}?subject=Suite à votre demande d'immersion chez ${businessName}">${potentialBeneficiaryEmail}</a>
      `,
      subContent: defaultSignature("immersion"),
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
      subject: `Coordonnées téléphoniques pour faire votre demande d'immersion`,
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
        "Coordonnées de l'entreprise pour faire votre demande d'immersion",
      greetings: `Bonjour ${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName},`,
      content: `Vous avez manifesté de l’intérêt pour réaliser une immersion professionnelle au sein de l’entreprise ${businessName}.

    Cette entreprise souhaite que vous vous rendiez sur place pour présenter votre demande. 

    Voici les coordonnées :
    - Personne à contacter : <strong>${contactFirstName} ${contactLastName}</strong>
    - Adresse de l'entreprise : <strong>${businessAddress}</strong>
    `,
      highlight: {
        content:
          "Ces informations sont personnelles et confidentielles. Elles ne peuvent pas être communiquées à d’autres personnes. ",
      },
      subContent: defaultSignature("immersion"),
    }),
  },
  SHARE_DRAFT_CONVENTION_BY_LINK: {
    niceName: "Partager le formulaire de convention par lien",
    tags: ["partage de convention"],
    createEmailVariables: ({
      additionalDetails,
      conventionFormUrl,
      internshipKind,
    }) => ({
      subject: `${
        internshipKind ? "Immersion Facilitée" : "Mini Stage"
      } - Pour action : une demande de convention préremplie vous est transmise pour que vous la complétiez`,
      greetings: "Bonjour,",
      content: `
        <strong>Une demande de convention ${
          internshipKind === "immersion" ? "d'immersion" : "de mini stage"
        } doit être complétée :</strong>
        ${additionalDetails}
      `,
      buttons: [{ label: "Compléter la demande", url: conventionFormUrl }],
      subContent: defaultSignature(internshipKind),
    }),
  },
  SUGGEST_EDIT_FORM_ESTABLISHMENT: {
    niceName: "Suggestion de mise à jour d'établissement",
    tags: ["mise à jour fiche entreprise"],
    createEmailVariables: ({ editFrontUrl }) => ({
      subject:
        "Mettez à jour votre fiche entreprise sur le site Immersion Facilitée",
      greetings: "Bonjour,",
      content: `Votre entreprise est inscrite dans l'annuaire des entreprises accueillantes d'Immersion Facilitée depuis au moins 6 mois. Merci !

      Vous pouvez mettre à jour, si vous le souhaitez, les informations saisies au moment du référencement.
      
      Vous pouvez :
      • ajouter ou supprimer des métiers
      • modifier l'enseigne ou l'adresse
      • modifier les coordonnées du référent "Immersion"
      • modifier le mode de contact souhaité
      • ajouter un lien vers le site ou des informations complémentaires sur l'activité de l'entreprise
      • en suspendre la visibilité
      `,
      subContent: `Nous vous invitons à cliquer sur le bouton ci-dessus pour mettre à jour vos informations.
      
      Si vous n'avez pas besoin de faire de modifications, vous n'avez rien à faire, les informations concernant votre entreprise seront affichées à l'identique.
      
      ${defaultSignature("immersion")}`,
      legals:
        "* Pour les entreprises de 20 salariés et plus, les personnes en situation de handicap accueillies en immersion sont comptabilisées au titre de l'obligation d'emploi.",
      buttons: [
        { label: "Mettre à jour ma fiche établissement", url: editFrontUrl },
      ],
      highlight: {
        content: `Nouveautés ! Il est maintenant possible de :
        • limiter le nombre de mises en relations reçues par semaine,
        • informer que votre entreprise peut accueillir en immersion des personnes en situation de handicap *.`,
      },
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
      buttons: [{ label: "Modifier ma fiche entreprise", url: editFrontUrl }],
      highlight: {
        content: `Si vous n'êtes pas à l'origine de cette demande, nous vous recommandons de nous contacter rapidement par mail : ${immersionFacileContactEmail}.`,
      },
      subContent: defaultSignature("immersion"),
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
      subject: `Confirmation de création de votre établissement ${businessName} pour accueillir des immersions`,
      greetings: "Bonjour,",
      content: `
      <strong>Félicitations !</strong>

      Vous venez d'enregistrer votre établissement ${businessName} pour accueillir des immersions professionnelles.      

      ${contactFirstName} ${contactLastName} recevra bien les demandes d'immersion.      

      Pour ces demandes, il n'est pas utile de demander un CV. Il s'agit seulement de passer quelques jours ensemble pour une découverte réciproque. 

      Si vous avez des projets de recrutement et si, grâce à une immersion, vous retenez un profil qui vous convient, un conseiller emploi vous proposera, si nécessaire,  un plan de formation sur mesure. 

      Merci d'avoir rejoint la communauté des “entreprises s'engagent” et de contribuer ainsi à l'accès à l'emploi de tous les publics.
      `,
      subContent: defaultSignature("immersion"),
      buttons: [
        {
          label: "Nos bons conseils",
          url: "https://immersion.cellar-c2.services.clever-cloud.com/livret_accueil_entreprise.pdf",
        },
      ],
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
      internshipKind,
      agencyLogoUrl,
      agencyValidatorEmail,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? "Comment s'est déroulée l'immersion ?"
          : "Mini Stage - Comment s'est déroulée le mini stage ?",
      greetings: `Bonjour ${establishmentTutorName},`,
      content: `
      ${
        internshipKind === "immersion"
          ? "L'immersion professionnelle"
          : "Le mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} au sein de votre entreprise est en passe de s'achever. 

      Nous vous remercions de votre accueil. 

      Pouvez-vous indiquer si ${
        internshipKind ? "cette immersion" : "ce mini stage"
      } s'est bien déroulée jusqu'à sa date de fin prévue ?`,
      buttons: [
        {
          label: `Evaluer ${
            internshipKind === "immersion" ? "cette immersion" : "ce mini stage"
          }`,
          url: immersionAssessmentCreationLink,
        },
      ],
      subContent: `
      Cette information est importante pour la suite de son parcours professionnel. 

      N'oubliez pas non plus de compléter avec ${beneficiaryFirstName} ${beneficiaryLastName} le ${
        internshipKind === "immersion"
          ? `<a href="https://immersion.cellar-c2.services.clever-cloud.com/PMSMP_Bilan.pdf">bilan de l'immersion en PDF</a>`
          : `<a href="https://immersion.cellar-c2.services.clever-cloud.com/CCI_MiniStage_Bilan.pdf">bilan du mini stage en PDF</a>`
      }.
      Envoyez-le à <a href= "mailto:${agencyValidatorEmail}" target="_blank">${agencyValidatorEmail}</a> 

      En cas de difficulté, prévenez au plus vite la structure d’accompagnement pour que vous soyez conseillé au mieux.
       
      Merci  !      
      ${defaultSignature(internshipKind)}
      `,
      agencyLogoUrl,
    }),
  },
  FULL_PREVIEW_EMAIL: {
    niceName: "Preview email complet (tous les blocs)",
    tags: ["aperçu pour tests"],
    createEmailVariables: ({
      beneficiaryName,
      conventionStatusLink,
      internshipKind,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      businessName,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      establishmentRepresentativeName,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      magicLink,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      signatoryName,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      beneficiaryCurrentEmployerName,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      beneficiaryRepresentativeName,
      agencyLogoUrl,
    }) => ({
      subject: "Test contenant toutes les blocs email",
      greetings: `Bonjour ${beneficiaryName}`,
      content: `Merci d'avoir confirmé votre demande ${
        internshipKind ? "d'immersion" : "de mini stage"
      }. Elle va être transmise à votre ${
        internshipKind === "immersion"
          ? "conseiller"
          : "conseiller de la Chambre de Commerce et d'Instrustrie - CCI"
      } référent.
      
      Il vous informera par mail de la validation ou non ${
        internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
      }. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.`,
      legals: defaultConventionFinalLegals(internshipKind),
      buttons: [
        { label: "Label de bouton", url: "http://www.example.com" },
        createConventionStatusButton(conventionStatusLink),
      ],
      subContent: `Il vous informera par mail de la validation ou non ${
        internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
      }. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.
      
      ${defaultSignature(internshipKind)}
      `,
      highlight: {
        content: `Attention, ne démarrez pas ${
          internshipKind === "immersion" ? "cette immersion" : "ce mini stage"
        } tant que vous n'avez pas reçu cette validation !`,
      },
      agencyLogoUrl,
    }),
  },
  SIGNEE_HAS_SIGNED_CONVENTION: {
    niceName: "Confirmation de signature de l'immersion",
    createEmailVariables: ({
      conventionId,
      signedAt,
      conventionStatusLink,
      internshipKind,
      agencyLogoUrl,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? `Confirmation de signature de l'immersion - ${conventionId}`
          : `Mini Stage - Confirmation de signature du mini stage - ${conventionId}`,
      greetings: `Bonjour,`,
      content: `
      Nous confirmons que vous avez signé ${
        internshipKind === "immersion"
          ? "la convention d'immersion professionnelle"
          : "le mini stage"
      } ${conventionId} le ${
        isStringDate(signedAt)
          ? toDisplayedDate(new Date(signedAt), true)
          : "DATE INVALIDE"
      }.
      `,
      highlight: {
        content: `
        Attention. Votre convention est en cours d'examen.
        Avant de débuter ${
          internshipKind === "immersion" ? "l'immersion" : "le mini stage"
        }, veuillez vous assurer que la convention a bien été validée par un conseiller${
          internshipKind === "immersion"
            ? ""
            : " de la chambre de commerce et d'instrustrie - CCI"
        }.
        Vous recevrez une notification lorsque ce sera fait.
        `,
      },
      subContent: defaultSignature(internshipKind),
      buttons: [createConventionStatusButton(conventionStatusLink)],
      agencyLogoUrl,
    }),
    tags: ["confirmation de signature de convention"],
  },
  IC_USER_RIGHTS_HAS_CHANGED: {
    niceName: "Notification de changement de droit (Utilisateur IC)",
    tags: ["notification changement de droit utilisateur ic"],
    createEmailVariables: ({ agencyName }) => ({
      subject: `Immersion Facilitée - Vos droits ont été modifiés `,
      greetings: "Bonjour,",
      content: `

        Nous vous confirmons que vous venez d'être rattaché a l'agence : ${agencyName}. 
        
        Merci à vous !`,
      subContent: defaultSignature("immersion"),
    }),
  },
});
