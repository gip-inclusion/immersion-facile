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
      demandeId,
      agencyLogoUrl,
    }) => ({
      subject: `${
        internshipKind === "immersion"
          ? "Immersion Facilitée - Votre confirmation pour votre demande de convention est enregistrée"
          : "Mini Stage - Votre confirmation pour votre demande de mini stage est enregistrée"
      }`,
      greetings: `Bonjour ${firstName} ${lastName},`,
      content: `
        Merci d'avoir confirmé votre demande de convention. Elle va être transmise à votre conseiller référent.
        La convention est enregistrée avec le numéro: ${demandeId}.

        Il vous informera par mail de la validation ou non ${
          internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
        }. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.`,
      highlight: `Attention, ne démarrez pas ${
        internshipKind === "immersion" ? "cette immersion" : "ce mini stage"
      } tant que vous n'avez pas reçu cette validation !`,
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
      demandeId,
      agencyLogoUrl,
    }) => ({
      subject: `${
        internshipKind === "immersion"
          ? "Immersion Facilitée - Demande de convention confirmée"
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
      highlight: `Attention, ne démarrez pas ${
        internshipKind === "immersion" ? "cette immersion" : "ce mini stage"
      } tant que vous n'avez pas reçu la validation !`,
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      demandeId,
      agencyLogoUrl,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? `Immersion Facilitée - une demande de convention d'immersion est déposée : ${firstName}, ${lastName} - ${businessName} - ${agencyName}.`
          : `Mini Stage - une demande de convention de mini stage est déposée : ${firstName}, ${lastName} - ${businessName} - ${agencyName}.`,
      greetings: "Bonjour,",
      content: `
      <strong>Une nouvelle demande ${
        internshipKind === "immersion"
          ? "d'immersion professionnelle"
          : "de mini stage"
      } a été enregistrée.</strong>      ­

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
      agencyName,
      emergencyContactInfos,
      beneficiaryBirthdate,
      internshipKind,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      questionnaireUrl,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      totalHours,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      emergencyContact,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      emergencyContactPhone,
      agencyLogoUrl,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? `Immersion Facilitée - Validation et convention de l'immersion pour observer l'activité de ${immersionAppellationLabel} au sein de ${businessName}`
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
      } peut donc démarrer aux dates convenues*.       
      
      ${
        internshipKind === "immersion"
          ? `À la fin de l'immersion, nous vous remercions de compléter la fiche d'évaluation de l'immersion <a href="https://immersion.cellar-c2.services.clever-cloud.com/bilan-immersion-professionnelle-inscriptible.pdf">à télécharger ici</a>, et de l'envoyer au conseiller qui a signé la convention (Pôle Emploi, Mission Locale…). Cette évaluation doit être complétée par le tuteur, si possible en présence du bénéficiaire de l'immersion.`
          : `À la fin du mini stage, nous vous remercions de compléter la fiche d'évaluation du mini stage <a href="??????????">NOTICE BILAN A FOURNIR</a>, et de l'envoyer au conseiller de la Chambre de Commerce et d'Instrustrie - CCI qui a signé la convention. Cette évaluation doit être complétée par le tuteur, si possible en présence du bénéficiaire du mini stage.`
      }
      
      En cas de difficulté, prévenez au plus vite votre ${
        internshipKind === "immersion"
          ? "conseiller"
          : "conseiller de la Chambre de Commerce et d'Instrustrie - CCI"
      } pour qu'il vous conseille au mieux.       
      ${defaultSignature(internshipKind)}

      ${
        emergencyContactInfos
          ? `Si la situation l'impose, le contact d'urgence de ${beneficiaryFirstName} ${beneficiaryLastName} :
        ${emergencyContactInfos}
        
        `
          : ""
      }      
      ${
        internshipKind === "immersion"
          ? "Vous trouverez ci-dessous la convention d'immersion professionnelle:"
          : "Vous trouverez ci-dessous la convention de mini stage :"
      }`,
      highlight:
        internshipKind === "immersion"
          ? "Convention d'immersion professionnelle"
          : "Convention de mini stage",
      subContent: `Cette convention est établie entre :
      ${[
        `${beneficiaryFirstName} ${beneficiaryLastName}`,
        beneficiaryRepresentativeName,
        beneficiaryCurrentEmployerName,
        establishmentRepresentativeName,
        agencyName,
      ]
        .filter((str) => !!str)
        .map((str) => `- ${str}`)
        .join("\n")}
      
      
      Toutes ces parties ont signé cette convention par le moyen d'une signature électronique, dans le cadre d'une téléprocédure créée par l'Etat. 
      
      ${
        internshipKind === "immersion" ? "Cette immersion" : "Ce mini stage"
      } se déroulera au sein de ${businessName}, à l'adresse suivante ${immersionAddress}.
      
      ${
        internshipKind === "immersion" ? "L'immersion" : "Le mini stage"
      } se déroulera du ${dateStart} au ${dateEnd}. 
      
      Les horaires ${
        internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
      } seront :
      ${scheduleText}       
      
      ${
        internshipKind === "immersion" ? "L'immersion" : "Le mini stage"
      } aura pour objectif de découvrir les activités nécessaires en lien avec le métier de ${immersionAppellationLabel}.
      
      Ces activités sont : ${immersionActivities}
      
      Les compétences et savoir-être observés sont : ${immersionSkills}.
      
      ${
        internshipKind === "immersion" ? "Cette immersion" : "Ce mini stage"
      } se déroulera dans les conditions réelles d'exercice de ce métier. 
      
      ${
        workConditions
          ? `Les conditions particulières d'exercice du métier sont : ${workConditions}`
          : ""
      }
      
      
      Encadrement : ${beneficiaryFirstName} ${beneficiaryLastName} sera encadré(e) par ${establishmentTutorName}.

      Dans le cadre de ${
        internshipKind === "immersion" ? "cette immersion" : "ce mini stage"
      },      
      - des mesures de prévention sanitaire sont prévues :      
      ${sanitaryPrevention}.
      - un équipement de protection est fourni : ${individualProtection}.
      
      ${beneficiaryFirstName} ${beneficiaryLastName}, ${beneficiaryRepresentativeName} et ${establishmentRepresentativeName} en signant cette convention, s'engagent à respecter les obligations réglementaires ${
        internshipKind === "immersion"
          ? "de la Période de Mise en Situation Professionnelle"
          : "du mini stage"
      }, rappelées ci-après.
      
      ${signature}`,
      legals: defaultConventionFinalLegals(internshipKind),
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
      subject: `Immersion Facilitée - la demande de convention d'immersion envoyée par ${beneficiaryFirstName} ${beneficiaryLastName} est totalement signée. A vous de la valider !`,
      greetings: `Bonjour ${advisorFirstName} ${advisorLastName},`,
      content: `
      <strong>La demande d'immersion de ${beneficiaryFirstName} ${beneficiaryLastName} est signée. 
      A vous de l'étudier !</strong>`,
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
      
      <strong>Entreprise  d'accueil :</strong>
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
      subject: `Immersion Facilitée - une demande de convention d'immersion vous est directement adressée par: ${beneficiaryFirstName} ${beneficiaryLastName}`,
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
          ? `Immersion Facilitée - Refus de la demande d'immersion pour observer l'activité de ${immersionProfession} au sein de ${businessName}`
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
          ? "Immersion Facilitée - veuillez modifier cette demande d'immersion professionnelle"
          : "Mini Stage - veuillez modifier cette demande de mini stage",
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
          ? `Immersion Facilitée - Demande d'immersion à étudier: ${beneficiaryFirstName} ${beneficiaryLastName} - ${businessName}`
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
          ? "Immersion Facilitée - Voici votre nouveau lien magique pour accéder à la demande d'immersion"
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
      conventionStatusLink,
      internshipKind,
      agencyLogoUrl,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? "Immersion Facilitée - À vous de confirmer votre demande de convention"
          : "Mini Stage - À vous de confirmer votre demande de mini stage",
      greetings: "Bonjour,",
      content: `
      La demande de convention pour ${
        internshipKind === "immersion" ? "l'immersion" : "le mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} pour le métier de ${immersionProfession} dans l'entreprise ${businessName} encadré par ${establishmentRepresentativeName} vient d'être signée par ${existingSignatureName}.

      <strong>À vous maintenant de la confirmer !</strong>
      `,
      buttons: [
        { url: magicLink, label: "Confirmer ma demande de convention" },
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
          ? "Immersion Facilitée - Confirmez une demande d'immersion"
          : "Mini Stage - Confirmez une demande de mini stage",
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
           - L'entreprise ${businessName}
           - Le tuteur dans l'entreprise ${establishmentRepresentativeName}
        
          <strong>Votre confirmation est obligatoire</strong> pour permettre à votre ${
            internshipKind === "immersion"
              ? "conseiller"
              : "conseiller de la Chambre de Commerce et d'Instrustrie - CCI"
          } de valider la convention. Merci  !
        
        Vous devez maintenant confirmer votre demande.`,
      buttons: [
        { url: magicLink, label: "Confirmer ma demande" },
        createConventionStatusButton(conventionStatusLink),
      ],
      highlight: `Attention, ne démarrez pas votre ${
        internshipKind === "immersion" ? "immersion" : "mini stage"
      } tant que vous n'avez pas reçu cette validation ! Vous n'auriez pas de couverture en cas d'accident.`,
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
      buttons: [
        {
          url: "https://immersion.cellar-c2.services.clever-cloud.com/les_bons_conseils_entreprise.pdf",
          label: "Nos bons conseils",
        },
      ],
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
      } - Une demande de convention préremplie vous est transmise pour que vous la complétiez`,
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
    niceName: "Suggestion de mise à jour d'etablissement",
    tags: ["mise à jour fiche entreprise"],
    createEmailVariables: ({ editFrontUrl }) => ({
      subject:
        "Immersion Facilitée - Mettez à jour les informations de votre entreprise accueillante",
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
      highlight: `Nouveauté ! Il est maintenant possible d'informer que votre entreprise peut accueillir en immersion des personnes en situation de handicap *`,
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
      highlight: `Si vous n'êtes pas à l'origine de cette demande, nous vous recommandons de nous contacter rapidement par mail : ${immersionFacileContactEmail}.`,
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
    }) => ({
      subject:
        internshipKind === "immersion"
          ? "Immersion Facilitée - Comment s'est déroulée l'immersion ?"
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
          ? `<a href="https://immersion.cellar-c2.services.clever-cloud.com/0a57f38d-1dbe-4eb4-8835-9b8fc48a13d8.pdf">bilan de l'immersion en PDF</a>`
          : `<a href="?????????????????????????">?????????????????BILAN MINI STAGE en PDF???????</a>`
      }. 

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
      highlight: `Attention, ne démarrez pas ${
        internshipKind === "immersion" ? "cette immersion" : "ce mini stage"
      } tant que vous n'avez pas reçu cette validation !`,
      agencyLogoUrl,
    }),
  },
  SIGNEE_HAS_SIGNED_CONVENTION: {
    niceName: "Confirmation de signature de l'immersion",
    createEmailVariables: ({
      demandeId,
      signedAt,
      conventionStatusLink,
      internshipKind,
      agencyLogoUrl,
    }) => ({
      subject:
        internshipKind === "immersion"
          ? `Immersion Facilitée - Confirmation de signature de l'immersion - ${demandeId}`
          : `Mini Stage - Confirmation de signature du mini stage - ${demandeId}`,
      greetings: `Bonjour,`,
      content: `
      Nous confirmons que vous avez signé ${
        internshipKind === "immersion"
          ? "la convention d'immersion professionnelle"
          : "le mini stage"
      } ${demandeId} le ${
        isStringDate(signedAt)
          ? toDisplayedDate(new Date(signedAt), true)
          : "DATE INVALIDE"
      }.
      `,
      highlight: `
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
      subContent: defaultSignature(internshipKind),
      buttons: [createConventionStatusButton(conventionStatusLink)],
      agencyLogoUrl,
    }),
    tags: ["confirmation de signature de convention"],
  },
});
