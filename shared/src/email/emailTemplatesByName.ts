import { createTemplatesByName } from "html-templates";
import {
  type ConventionId,
  type InternshipKind,
  labelsForImmersionObjective,
} from "../convention/convention.dto";
import type { AgencyRole } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { frontRoutes } from "../routes/routes";
import { isStringDate, toDisplayedDate } from "../utils/date";
import type { EmailParamsByEmailType } from "./EmailParamsByEmailType";
import { advices } from "./advices";
import { defaultConventionFinalLegals } from "./defaultConventionFinalLegals";
import { immersionFacileDelegationEmail } from "./knownEmailsAddresses";

const defaultSignature = (internshipKind: InternshipKind) =>
  internshipKind === "immersion"
    ? `
    Bonne journée,
    L'équipe Immersion Facilitée
`
    : `
    Bonne journée, 
    L’équipe de votre Chambre consulaire.
`;

// to add a new EmailType, or changes the params of one, edit first EmailParamsByEmailType and let types guide you
export const emailTemplatesByName =
  createTemplatesByName<EmailParamsByEmailType>({
    ASSESSMENT_AGENCY_FIRST_REMINDER: {
      niceName:
        "Bilan - Prescripteurs - Relance à 3 jours après la fin de l’immersion",
      tags: ["bilan_prescripteur_formulaireBilan_J+3"],
      createEmailVariables: ({
        assessmentCreationLink,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        establishmentContactEmail,
        internshipKind,
      }) => ({
        subject: `Immersion Facilitée - Bilan non complété pour l'immersion de ${beneficiaryFirstName}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
        Nous constatons que le bilan de l’immersion de ${beneficiaryFirstName} ${beneficiaryLastName} n’a pas encore été complété par l’entreprise ${businessName}.
        
        Afin de clôturer cette étape, vous pouvez :
        
        1. <a href= "mailto:${establishmentContactEmail}" target="_blank">Relancer directement l'entreprise</a> (${establishmentContactEmail}) pour qu’elle remplisse le bilan en ligne.
        2. Les contacter par téléphone pour les accompagner dans la saisie du bilan.
        `,
        buttons: [
          {
            label: "Formulaire de bilan",
            url: assessmentCreationLink,
          },
        ],
        subContent: `
        ${defaultSignature(internshipKind)}
        `,
      }),
    },
    ASSESSMENT_AGENCY_SECOND_REMINDER: {
      niceName:
        "Bilan - Prescripteurs - Relance à 10 jours après la fin de l’immersion",
      tags: ["bilan_prescripteur_formulaireBilan_J+10"],
      createEmailVariables: ({
        assessmentCreationLink,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        establishmentContactEmail,
        internshipKind,
      }) => ({
        subject: `Immersion Facilitée - Urgent : Bilan toujours non complété pour l'immersion de ${beneficiaryFirstName}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
        Malgré une première relance, le bilan de l’immersion de ${beneficiaryFirstName} ${beneficiaryLastName} chez ${businessName} reste incomplet.
        
        1. <a href= "mailto:${establishmentContactEmail}" target="_blank">Relancer l'entreprise</a> (${establishmentContactEmail}) pour qu’elle remplisse le bilan.
        2. Les contacter par téléphone et les accompagner pour le compléter ensemble.
        `,
        buttons: [
          {
            label: "Formulaire de bilan",
            url: assessmentCreationLink,
          },
        ],
        subContent: `
        ${defaultSignature(internshipKind)}
        `,
      }),
    },
    ASSESSMENT_AGENCY_NOTIFICATION: {
      niceName: "Bilan - Prescripteurs - Lien de création du bilan",
      tags: ["bilan_prescripteur_formulaireBilan"],
      createEmailVariables: ({
        agencyLogoUrl,
        assessmentCreationLink,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        internshipKind,
      }) => ({
        subject: `Immersion Facilitée - Bilan disponible pour l'immersion de ${beneficiaryFirstName} ${beneficiaryLastName}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      ${
        internshipKind === "immersion"
          ? "L'immersion professionnelle"
          : "Le mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} au sein de l’entreprise ${businessName} est en passe de s'achever.

      Nous venons d’envoyer le bilan de l’immersion à l’entreprise. Vous pouvez, si vous le souhaitez, les contacter par téléphone pour les accompagner dans la saisie du bilan.
      `,
        buttons: [
          {
            label: "Formulaire de bilan",
            url: assessmentCreationLink,
          },
        ],
        subContent: `
      Ces informations sont importantes pour la suite du parcours professionnel de ${beneficiaryFirstName} ${beneficiaryLastName}.    
      ${defaultSignature(internshipKind)}
      `,
        agencyLogoUrl,
      }),
    },
    ASSESSMENT_ESTABLISHMENT_NOTIFICATION: {
      niceName: "Bilan - Entreprise - Lien de creation du bilan",
      tags: ["bilan_entreprise_formulaireBilan"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryFirstName,
        beneficiaryLastName,
        conventionId,
        establishmentTutorName,
        assessmentCreationLink,
        internshipKind,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? "Comment s'est déroulée l'immersion ?"
            : "Mini Stage - Comment s'est déroulé le mini stage ?",
        greetings: greetingsWithConventionId(
          conventionId,
          establishmentTutorName,
        ),
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
              internshipKind === "immersion"
                ? "cette immersion"
                : "ce mini stage"
            }`,
            url: assessmentCreationLink,
          },
        ],
        subContent: `
      Ces informations sont importantes pour la suite de son parcours professionnel. 

      En cas de difficulté, prévenez au plus vite la structure d’accompagnement pour que vous soyez conseillé au mieux.
       
      Merci  !      
      ${defaultSignature(internshipKind)}
      `,
        agencyLogoUrl,
      }),
    },
    ASSESSMENT_CREATED_ESTABLISHMENT_NOTIFICATION: {
      niceName: "Bilan - Établissement - Bilan complété",
      tags: ["bilan_etablissement_bilanComplete"],
      createEmailVariables: ({
        recipientFullName,
        beneficiaryFullName,
        linkToAssessment,
        businessName,
        internshipKind,
      }) => ({
        subject: `Le bilan ${
          internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
        } de ${beneficiaryFullName} est complété`,
        greetings: `Bonjour ${recipientFullName},`,
        content: `Le bilan ${
          internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
        } de ${beneficiaryFullName} au sein de votre entreprise ${businessName} est désormais finalisé.
        
        Consultez-le dès maintenant :
        `,
        buttons: [
          {
            label: "Consulter le bilan",
            url: linkToAssessment,
            target: "_blank",
          },
        ],
        subContent: `Ce document récapitule les éléments clés ${
          internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
        }.
        
        Merci pour votre engagement dans l'accueil des candidats en ${
          internshipKind === "immersion" ? "immersion" : "stage"
        } !
        ${defaultSignature(internshipKind)}`,
      }),
    },
    ASSESSMENT_BENEFICIARY_NOTIFICATION: {
      niceName: "Bilan - Bénéficiaire - Accompagnement au remplissage",
      tags: ["bilan_bénéficiaire_accompagnementBilan"],
      createEmailVariables: ({
        conventionId,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        internshipKind,
      }) => ({
        subject: `Remplissez le bilan de fin ${
          internshipKind === "immersion" ? "d'immersion" : "de mini-stage"
        } avec votre tuteur`,
        greetings: greetingsWithConventionId(
          conventionId,
          `${beneficiaryFirstName} ${beneficiaryLastName}`,
        ),
        content: `
        Votre ${
          internshipKind === "immersion"
            ? "immersion professionnelle"
            : "mini-stage"
        } au sein de l'entreprise ${businessName} se termine.
        
        Prenez quelques instants avec votre tuteur : il a reçu par mail l'accès au formulaire de bilan qu'il devra compléter en votre présence.
        Cela vous servira dans la suite de votre parcours professionnel, que ce soit une formation, une embauche, une découverte de métier.
        
        À la fin de votre immersion, contactez votre conseiller pour faire part de vos impressions et finaliser ainsi votre bilan.
        `,
        subContent: defaultSignature(internshipKind),
      }),
    },
    ASSESSMENT_CREATED_WITH_STATUS_COMPLETED_AGENCY_NOTIFICATION: {
      niceName:
        "Bilan - Prescripteurs - Notification de création du bilan à l'agence (cas complet ou partiel)",
      tags: ["bilan_complet_ou_partiel_créé_prescripteur_confirmation"],
      createEmailVariables: ({
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        conventionDateEnd,
        immersionObjective,
        internshipKind,
        immersionAppellationLabel,
        assessment,
        numberOfHoursMade,
        magicLink,
      }) => {
        const lastDayOfPresence =
          assessment.status === "COMPLETED"
            ? conventionDateEnd
            : (assessment.lastDayOfPresence ?? "");
        return {
          subject: `Pour information : évaluation ${
            internshipKind === "immersion" ? "de l'immersion" : "du mini-stage"
          } de ${beneficiaryFirstName} ${beneficiaryLastName}`,
          greetings: greetingsWithConventionId(conventionId),
          content: `Le tuteur de ${beneficiaryFirstName} ${beneficiaryLastName} a évalué son ${
            internshipKind === "immersion" ? "immersion" : "mini-stage"
          } au sein de l'entreprise ${businessName}.
  
          <strong>Métier observé : ${immersionAppellationLabel}</strong>
          <strong>Objectif ${
            internshipKind === "immersion" ? "de l'immersion" : "du mini-stage"
          } : ${immersionObjective}
          </strong>
          Voici les informations saisies concernant cette immersion :<!--   
       --><ul><!--   
         --><li>L'immersion a-t-elle bien eu lieu ? Oui</li><!--   
         --><li>Nombre d'heures totales de l'immersion : ${numberOfHoursMade}</li><!--   
         --><li>Date réelle de fin de l'immersion : ${
           isStringDate(lastDayOfPresence)
             ? toDisplayedDate({
                 date: new Date(lastDayOfPresence),
                 withHours: false,
               })
             : "DATE INVALIDE"
         }
          </ul>
          <strong>Résultats de l'immersion :</strong><!--   
       --><ul><!--   
           --><li>Embauche : ${assessment.endedWithAJob ? "Oui" : "Non"}</li><!--          
           -->${
             assessment.endedWithAJob
               ? `<!--          
             --><li>Date d'embauche : ${toDisplayedDate({
               date: new Date(assessment.contractStartDate),
             })}</li><!--   
             --><li>Type de contrat : ${assessment.typeOfContract}</li>`
               : ""
           }
          </ul>
          <strong>Appréciation générale : </strong>
          ${assessment.establishmentFeedback}
          
          <strong>Conseils pour la suite : </strong>
          ${assessment.establishmentAdvices}
          
          `,
          buttons: [
            {
              label: "Consulter le bilan",
              url: magicLink,
            },
          ],
          subContent: `
          La fiche bilan a également été communiquée au candidat.

          ${defaultSignature(internshipKind)}`,
        };
      },
    },
    ASSESSMENT_CREATED_WITH_STATUS_DID_NOT_SHOW_AGENCY_NOTIFICATION: {
      niceName:
        "Bilan - Prescripteurs - Notification de création du bilan à l'agence - (cas absent)",
      tags: ["bilan_absent_créé_prescripteur_confirmation"],
      createEmailVariables: ({
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        immersionObjective,
        internshipKind,
        immersionAppellationLabel,
      }) => {
        return {
          subject: `Pour information : évaluation ${
            internshipKind === "immersion" ? "de l'immersion" : "du mini-stage"
          } de ${beneficiaryFirstName} ${beneficiaryLastName}`,
          greetings: greetingsWithConventionId(conventionId),
          content: `${
            internshipKind === "immersion" ? "L'immersion" : "Le mini-stage"
          } prévue pour ${beneficiaryFirstName} ${beneficiaryLastName}, au sein de l'entreprise ${businessName} n'a pas eu lieu.
  
          <strong>Métier observé : ${immersionAppellationLabel}</strong>
          <strong>Objectif ${
            internshipKind === "immersion" ? "de l'immersion" : "du mini-stage"
          } : ${immersionObjective}
          </strong>
          
          Nous vous invitons à contacter l'entreprise si vous souhaitez obtenir des précisions supplémentaires.
          
          La fiche bilan a également été communiquée au candidat.`,

          subContent: defaultSignature(internshipKind),
        };
      },
    },
    ASSESSMENT_CREATED_BENEFICIARY_NOTIFICATION: {
      niceName: "Bilan - Bénéficiaire - Bilan complété",
      tags: ["bilan_créé_bénéficiaire"],
      createEmailVariables: ({
        internshipKind,
        conventionId,
        beneficiaryFirstName,
        beneficiaryLastName,
        magicLink,
      }) => {
        return {
          subject: `Immersion Facilitée - Le bilan de votre ${
            internshipKind === "immersion" ? "immersion" : "mini-stage"
          } est disponible !`,
          greetings: greetingsWithConventionId(
            conventionId,
            `${beneficiaryFirstName} ${beneficiaryLastName}`,
          ),
          content: `
          <strong>Votre entreprise d'accueil a rédigé un avis concernant votre période ${
            internshipKind === "immersion" ? "d'immersion" : "de mini-stage"
          }.</strong> Ce retour peut être un atout pour vos futures candidatures en mettant en valeur vos expériences et compétences acquises.
          
          Pour consulter cet avis et le conserver dans votre dossier de candidature, vous pouvez le télécharger au format PDF en cliquant sur le bouton ci-dessous. Ce lien a une validité de 6 mois.
          `,
          buttons: [{ label: "Consulter mon bilan", url: magicLink }],
          subContent: `
          Nous vous encourageons à intégrer ce document dans vos candidatures afin de valoriser votre expérience auprès de vos futurs employeurs.
          
          N'hésitez pas à revenir vers nous si vous avez des questions ou besoin d'aide supplémentaire.
           
          ${defaultSignature(internshipKind)}
          `,
        };
      },
    },
    TEST_EMAIL: {
      niceName: "Email de test Immersion Facilitée",
      createEmailVariables: ({ input1, input2, url }) => ({
        subject:
          "[Immersion Facilitée] Le bilan de votre immersion est disponible !",
        greetings: "Bonjour,",
        content: `
          Cet email vous a été envoyé dans le cadre d'un test.

          - Input1 : ${input1}
          - Input2 : ${input2}
        `,
        buttons: [
          {
            label: "Bouton de test",
            target: "_blank",
            url,
          },
        ],
        subContent: `A très vite sur Immersion Facilitée,
L'équipe d'Immersion Facilitée`,
      }),
    },
    ESTABLISHMENT_CONTACT_REQUEST_REMINDER: {
      niceName: "Etablissement - Relance mise en relation",
      tags: ["relance_MER"],
      createEmailVariables: ({
        appellationLabel,
        beneficiaryReplyToEmail,
        beneficiaryFirstName,
        beneficiaryLastName,
        mode,
        domain,
      }) => ({
        subject: `[Demande d'immersion de ${beneficiaryFirstName} ${beneficiaryLastName}] Ce candidat attend toujours votre réponse.`,
        greetings: `Répondez vite à ${beneficiaryFirstName}`,
        content: `${beneficiaryFirstName} vous a contacté il y a ${
          mode === "3days" ? "3" : "7"
        } jours pour une demande d\`immersion pour le métier de ${appellationLabel}.
<b>Votre réponse est importante</b> : ${beneficiaryFirstName} a choisi votre entreprise et une immersion est souvent clé dans le parcours des candidates ou les candidats.
Ne tardez pas : répondez lui directement en utilisant le bouton ci-dessous : `,
        buttons: [
          {
            label: `Répondre à ${beneficiaryFirstName}`,
            url: `mailto:${beneficiaryReplyToEmail}`,
          },
          {
            label: "Connexion à votre espace entreprise",
            target: "_blank",
            url: `https://${domain}/${frontRoutes.establishmentDashboard}`,
          },
        ],
        subContent: `<strong>Si la connexion ne fonctionne pas et que vous ne recevez pas le lien de réinitialisation du mot de passe, c'est que vous n'avez pas encore créé votre compte</strong>.
        Créer votre compte avec le même mail que celui avec lequel les candidats vous contactent.

        A très vite sur Immersion Facilitée,
        L'équipe d'Immersion Facilitée`,
      }),
    },
    SHARE_DRAFT_CONVENTION_BY_LINK: {
      niceName: "Convention - Partage du formulaire par lien",
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
    NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
      niceName: "Convention - Demande de signature",
      tags: ["demande signature demande de convention"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryCurrentEmployerName,
        beneficiaryName,
        beneficiaryRepresentativeName,
        businessName,
        conventionId,
        establishmentRepresentativeName,
        establishmentTutorName,
        internshipKind,
        conventionSignShortlink,
        signatoryName,
        renewed,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Pour action : ${
                renewed ? "Immersion en entreprise prolongée," : ""
              } signez votre demande de convention`
            : `Pour action : ${
                renewed ? "Mini-stage en entreprise prolongé," : ""
              } signez votre demande de mini stage`,
        greetings: greetingsWithConventionId(conventionId, signatoryName),
        content: `Une demande de convention ${
          internshipKind === "immersion" ? "d'immersion" : "de mini stage"
        } vient d'être enregistrée. Vous devez maintenant la confirmer.
          ${
            renewed
              ? `\nCette convention a été renouvelée par le conseiller depuis la convention numéro : ${renewed.from}.
          La raison est la suivante : ${renewed.justification}.\n`
              : ""
          }
          Pour rappel, cette demande concerne : 
             - Le bénéficiaire ${beneficiaryName}${
               beneficiaryRepresentativeName
                 ? `\n- Le représentant légal du bénéficiaire ${beneficiaryRepresentativeName}`
                 : ""
             }${
               beneficiaryCurrentEmployerName
                 ? `\n- L'employeur actuel du bénéficiaire ${beneficiaryCurrentEmployerName}`
                 : ""
             }
             - L'entreprise ${businessName} représentée par ${establishmentRepresentativeName}
             - Le tuteur dans l'entreprise ${establishmentTutorName}
          
            <strong>Votre signature est obligatoire</strong> pour permettre à votre ${
              internshipKind === "immersion"
                ? "conseiller"
                : "conseiller de la Chambre consulaire ayant émis la convention"
            } de valider la convention. Merci !
          
          <strong>Ouvrez la demande via le bouton ci-dessous puis vérifiez les informations :</strong>
          - Si les informations sont correctes, cliquez sur “Signer” puis “Je termine la signature” sur l’écran suivant.
          - Si les informations ne sont pas correctes, cliquez sur le bouton "Annuler les signatures et demander une modification".`,
        buttons: [{ url: conventionSignShortlink, label: "Ouvrir ma demande" }],
        highlight: {
          content: `Attention, ne démarrez pas votre ${
            internshipKind === "immersion" ? "immersion" : "mini stage"
          } tant que vous n'avez pas reçu cette validation ! Vous n'auriez pas de couverture en cas d'accident.`,
        },
        subContent: `La décision de votre ${
          internshipKind === "immersion"
            ? "conseiller"
            : "conseiller de la de la Chambre consulaire ayant émis la convention"
        } vous sera transmise par mail.
  
          ${defaultSignature(internshipKind)}
        `,
        attachmentUrls:
          internshipKind === "immersion"
            ? [
                "https://immersion.cellar-c2.services.clever-cloud.com/Fiche memo-beneficiaire-immersionfacilitee2024.pdf",
              ]
            : undefined,
        agencyLogoUrl,
      }),
    },
    POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: {
      niceName:
        "Convention - Nouvelle convention à traiter par le conseiller France Travail lié",
      tags: [],
      createEmailVariables: ({
        advisorFirstName,
        advisorLastName,
        agencyLogoUrl,
        beneficiaryEmail,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        dateEnd,
        dateStart,
        immersionAddress,
        magicLink,
      }) => ({
        subject: `Une demande de convention d'immersion vous est directement adressée par: ${beneficiaryFirstName} ${beneficiaryLastName}`,
        greetings: greetingsWithConventionId(
          conventionId,
          `${advisorFirstName} ${advisorLastName}`,
        ),
        content: `
      <strong>Une nouvelle demande d'immersion a été enregistrée.</strong>

      Nous vous transmettons une demande de convention d'immersion (PMSMP) qui vient d'être faite par un demandeur d'emploi que vous suivez.

      <strong>Etape 1</strong> : Si le demandeur d’emploi n’est pas reconnu par CVM, procédez à son identification afin de pouvoir traiter le mail. Vous avez les informations à la fin de cet email. 
      Consultez la procédure à suivre pour clôturer cet email : <a href="https://drive.google.com/file/d/1tWL68ua1f-NgYnPkXs979_CkukPtlGRU/view?usp=sharing">Comment traiter un mail Immersion Facilitée dans CVM ?</a>

      <strong>Etape 2</strong> : <a href="${magicLink}" target="_blank">Vous pouvez y accéder en cliquant ici</a>  
      
      <strong>ATTENTION !</strong> Vous pouvez renvoyer un lien de signature par SMS en un clic aux signataires qui ont renseigné un numéro de mobile. Il vous suffit de cliquer sur le bouton 'Faire signer par SMS' dans l'encadré correspondant au signataire auquel vous souhaitez adresser le SMS.

      Tant que cette demande n'est pas encore confirmée par <strong>l'entreprise et par la/le bénéficiaire</strong>, vous pouvez demander des modifications ou la refuser, si nécessaire.

      <strong>La demande de modification et le refus sont à réaliser depuis l’écran Immersion Facilitée.</strong>

      Quand leur accord respectif sera enregistré, vous pourrez alors la valider. 

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
          "https://immersion.cellar-c2.services.clever-cloud.com/Fiche-memo-prescripteur-generale-immersionfacilitee2024.pdf",
        ],
        agencyLogoUrl,
      }),
    },
    NEW_CONVENTION_AGENCY_NOTIFICATION: {
      niceName: "Convention - Nouvelle convention à traiter par l'agence",
      tags: ["notification conseiller création demande d’immersion"],
      createEmailVariables: ({
        agencyLogoUrl,
        agencyName,
        businessName,
        conventionId,
        dateEnd,
        dateStart,
        firstName,
        internshipKind,
        lastName,
        magicLink,
        warning,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Une demande de convention d'immersion est déposée : ${firstName}, ${lastName} - ${businessName} - ${agencyName}.`
            : `Mini Stage - une demande de convention de mini stage est déposée : ${firstName}, ${lastName} - ${businessName} - ${agencyName}.`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      <strong>Une nouvelle demande ${
        internshipKind === "immersion"
          ? "d'immersion professionnelle"
          : "de mini stage"
      } a été enregistrée.</strong>

      

      Vous pouvez prendre connaissance de la demande en <a href="${magicLink}" target="_blank">cliquant ici</a>.
      <ul>
        <li><strong>ATTENTION !</strong> Vous pouvez renvoyer un lien de signature par SMS en un clic aux signataires qui ont renseigné un numéro de mobile. Il vous suffit de cliquer sur le bouton 'Faire signer par SMS' dans l'encadré correspondant au signataire auquel vous souhaitez adresser le SMS.</li>
        <li>Vous pouvez dès maintenant demander des modifications ou la refuser si nécessaire.</li>   
        <li>Vous ne pouvez pas la valider tant que le bénéficiaire et l'entreprise n'ont pas confirmé chacun leur accord pour cette demande.</li>
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
                "https://immersion.cellar-c2.services.clever-cloud.com/Fiche-memo-prescripteur-generale-immersionfacilitee2024.pdf",
              ]
            : undefined,
        agencyLogoUrl,
      }),
    },
    SIGNEE_HAS_SIGNED_CONVENTION: {
      niceName: "Convention - Confirmation de signature",
      createEmailVariables: ({
        agencyLogoUrl,
        conventionId,
        magicLink,
        internshipKind,
        signedAt,
        agencyName,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Confirmation de signature de l'immersion - ${conventionId}`
            : `Mini Stage - Confirmation de signature du mini stage - ${conventionId}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      Nous confirmons que vous avez signé ${
        internshipKind === "immersion"
          ? "la convention d'immersion professionnelle"
          : "la convention de mini stage "
      } le ${
        isStringDate(signedAt)
          ? toDisplayedDate({
              date: new Date(signedAt),
              withHours: true,
            })
          : "DATE INVALIDE"
      }.
      `,
        highlight: {
          content: `
        Attention. Votre convention est en cours d'examen.
        Avant de débuter ${
          internshipKind === "immersion" ? "l'immersion" : "le mini stage"
        }, veuillez vous assurer que la convention a bien été validée par un conseiller de la structure d'accompagnement du bénéficiaire (${agencyName}).
        Vous recevrez une notification lorsque ce sera fait.

        Dans le cas contraire, il y a des risques :

        Risque juridique pour l’entreprise : elle s’expose à des sanctions en cas de contrôle par l’inspection du travail. Sans convention, l'immersion pourrait être considérée comme du travail dissimulé.

        Absence de protection pour le candidat : il ne bénéficiera pas de couverture sociale pour les accidents de travail ou les maladies professionnelles liées à l’activité de l’entreprise. En cas d’accident, il pourrait se retrouver sans indemnisation de la sécurité sociale.
        `,
        },
        subContent: defaultSignature(internshipKind),
        buttons: [
          {
            url: magicLink,
            label: "Voir l'état de ma demande",
            target: "_blank",
          },
        ],
        agencyLogoUrl,
      }),
      tags: ["confirmation de signature de convention"],
    },
    POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED: {
      niceName:
        "Convention - Entièrement signée à traiter par le conseiller France Travail lié",
      tags: ["immersion à étudier (mail conseiller)"],
      createEmailVariables: ({
        advisorFirstName,
        advisorLastName,
        agencyLogoUrl,
        beneficiaryEmail,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        dateEnd,
        dateStart,
        magicLink,
        immersionAddress,
      }) => ({
        subject: `Pour action : la demande de convention d'immersion envoyée par ${beneficiaryFirstName} ${beneficiaryLastName} est totalement signée. À vous de la valider !`,
        greetings: greetingsWithConventionId(
          conventionId,
          `${advisorFirstName} ${advisorLastName}`,
        ),
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
          "https://immersion.cellar-c2.services.clever-cloud.com/Fiche-memo-prescripteur-generale-immersionfacilitee2024.pdf",
        ],
        agencyLogoUrl,
      }),
    },

    NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
      niceName: "Convention - Entièrement signée à traiter par l'agence",
      tags: ["notification conseiller demande d’immersion signée à valider"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        internshipKind,
        magicLink,
        possibleRoleAction,
        validatorName,
        peAdvisor,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Demande d'immersion à étudier: ${beneficiaryFirstName} ${beneficiaryLastName} - ${businessName}`
            : `Mini Stage - Demande de mini stage à étudier: ${beneficiaryFirstName} ${beneficiaryLastName} - ${businessName}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      <strong>Une nouvelle demande ${
        internshipKind === "immersion" ? "d'immersion" : "de mini stage"
      } vous est envoyée${validatorName ? ` par ${validatorName} ` : " "}pour que vous l'examiniez.</strong>
      
      ${
        peAdvisor && !peAdvisor.recipientIsPeAdvisor
          ? `Vous recevez cet email en copie de ${peAdvisor.firstName} ${peAdvisor.lastName} (${peAdvisor.email}).
      C'est à ce conseiller d'examiner cette demande d'immersion en priorité. En cas d'absence de sa part, un autre conseiller peut l'examiner afin de ne pas retarder le candidat.`
          : ""
      }
      
      Elle concerne le bénéficiaire ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName} 

      Nous vous remercions d'en prendre connaissance pour ${possibleRoleAction}.
      `,
        buttons: [
          {
            label: "Examiner la demande",
            url: magicLink,
            target: "_blank",
          },
        ],
        subContent: defaultSignature(internshipKind),
        attachmentUrls:
          internshipKind === "immersion"
            ? [
                "https://immersion.cellar-c2.services.clever-cloud.com/Fiche-memo-prescripteur-generale-immersionfacilitee2024.pdf",
              ]
            : undefined,
        agencyLogoUrl,
      }),
    },
    SIGNATORY_REMINDER: {
      niceName: "Convention - Dernier rappel de signature",
      tags: ["relance signatures manquantes"],
      createEmailVariables: ({
        actorFirstName,
        actorLastName,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        magicLinkUrl,
        signatoriesSummary,
      }) => ({
        subject:
          "RAPPEL URGENT - La convention démarrant dans moins de 24h n'est pas complètement signée",
        greetings: greetingsWithConventionId(
          conventionId,
          `${actorFirstName} ${actorLastName}`,
        ),
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
      niceName: "Convention - Premier rappel de validation à l'agence",
      tags: ["relance vérification manquante"],
      createEmailVariables: ({
        agencyMagicLinkUrl,
        agencyName,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        dateEnd,
        dateStart,
      }) => ({
        subject:
          "RAPPEL - Une demande de convention d'immersion démarrant d'ici 3 jours ouvrés doit être vérifiée",
        greetings: greetingsWithConventionId(conventionId),
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
      niceName: "Convention - Dernier rappel de validation à l'agence",
      tags: ["relance vérification manquante"],
      createEmailVariables: ({
        agencyMagicLinkUrl,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
      }) => ({
        subject:
          "RAPPEL URGENT - Une demande de convention d'immersion démarrant demain doit être vérifiée",
        greetings: greetingsWithConventionId(conventionId),
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
    VALIDATED_CONVENTION_FINAL_CONFIRMATION: {
      niceName: "Convention - Finale validée",
      tags: ["envoi convention"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryBirthdate,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        dateEnd,
        dateStart,
        emergencyContactInfos,
        establishmentTutorName,
        immersionAppellationLabel,
        internshipKind,
        magicLink,
        assessmentMagicLink,
        validatorName,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Validation et convention de l'immersion pour observer l'activité de ${immersionAppellationLabel} au sein de ${businessName}`
            : `Mini Stage - Validation et convention du mini stage pour observer l'activité de ${immersionAppellationLabel} au sein de ${businessName}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      Bonne nouvelle ! 

      La demande faite par ${beneficiaryFirstName} ${beneficiaryLastName} (né(e) le ${
        isStringDate(beneficiaryBirthdate)
          ? toDisplayedDate({ date: new Date(beneficiaryBirthdate) })
          : "Date invalide"
      }) pour réaliser une immersion du ${dateStart} au ${dateEnd}, au sein de ${businessName} et encadrée par ${establishmentTutorName} a été validée${
        validatorName ? ` par ${validatorName} ` : " "
      }et la convention est bien enregistrée. 
      
      ${internshipKind === "immersion" ? "L'immersion" : "Le mini stage"} peut donc démarrer aux dates convenues.       
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
      ${defaultSignature(internshipKind)}


      En cas de difficulté, prévenez au plus vite votre ${
        internshipKind === "immersion"
          ? "conseiller"
          : "conseiller de la Chambre consulaire ayant émis la convention"
      } pour qu'il vous conseille au mieux. 
      
      ${
        emergencyContactInfos
          ? `Si la situation l'impose, le contact d'urgence de ${beneficiaryFirstName} ${beneficiaryLastName} : ${emergencyContactInfos}`
          : ""
      }`,
        highlight: assessmentMagicLink
          ? {
              content: `
              Un imprévu ?

              Si l’immersion ne peut pas aller à son terme (abandon, arrêt anticipé, etc.), merci de nous le signaler dès que possible en <a href="${assessmentMagicLink}">déclarant un abandon</a> , pour assurer un bon suivi.`,
            }
          : undefined,
        agencyLogoUrl,
      }),
    },
    CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: {
      niceName: "Convention - Demande de modification",
      tags: ["demande de modifications"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        internshipKind,
        justification,
        magicLink,
        signature,
        requesterName,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? "Pour action : veuillez modifier cette demande d'immersion professionnelle"
            : "Pour action : mini Stage - veuillez modifier cette demande de mini stage",
        greetings: greetingsWithConventionId(conventionId),
        content: `Une demande de modification vous a été adressé par ${requesterName} concernant la demande ${
          internshipKind === "immersion" ? "d'immersion" : "de mini stage"
        } de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName}.
         
         <strong>Les raisons sont&nbsp;:</strong>
        ${justification}`,
        buttons: [
          {
            url: magicLink,
            label: "Modifier votre demande",
          },
        ],
        subContent: `
      Après avoir corrigé votre demande, il faudra de nouveau que tous les acteurs de la convention confirment leur accord. 
      
      Pensez à surveiller votre boite mail et à consulter vos spams si vous ne recevez pas le mail de demande de confirmation.      
      
      Bien cordialement,      
      ${signature}
      `,
        agencyLogoUrl,
      }),
    },
    CONVENTION_TRANSFERRED_AGENCY_NOTIFICATION: {
      niceName: "Convention - Changement prescripteur pour agence",
      tags: ["changement prescripteur demande d'immersion pour prescripteur"],
      createEmailVariables: ({
        previousAgencyName,
        justification,
        magicLink,
        conventionId,
        beneficiaryFirstName,
        beneficiaryLastName,
        beneficiaryEmail,
        beneficiaryPhone,
        internshipKind,
      }) => ({
        subject: `${previousAgencyName} vous a transmis une demande d'immersion`,
        greetings: greetingsWithConventionId(conventionId),
        content: `${previousAgencyName} a redirigé une demande d'immersion professionnelle vers votre structure pour la raison suivante :

${justification}

Vous pouvez vous rapprocher du candidat ${beneficiaryFirstName} ${beneficiaryLastName}
Email : ${beneficiaryEmail}
Tél : ${beneficiaryPhone}`,
        buttons: [
          {
            url: magicLink,
            label: "Examiner la demande",
          },
        ],
        subContent: `
      ${defaultSignature(internshipKind)}
      `,
      }),
    },
    CONVENTION_TRANSFERRED_SIGNATORY_NOTIFICATION: {
      niceName: "Convention - Changement prescripteur pour signataire",
      tags: ["changement prescripteur demande d'immersion pour signataire"],
      createEmailVariables: ({
        internshipKind,
        immersionProfession,
        previousAgencyName,
        newAgencyName,
        agencyAddress,
        businessName,
        justification,
        magicLink,
        conventionId,
      }) => ({
        subject: `Changement de prescripteur de la demande d'immersion pour observer l'activité de ${immersionProfession} au sein de ${businessName}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `Nous vous informons que le prescripteur ${previousAgencyName} a redirigé votre demande d'immersion professionnelle vers un autre prescripteur pour la raison suivante :

        ${justification}
        
        Vous pouvez vous rapprocher de votre conseiller chez ${newAgencyName} - ${agencyAddress} pour suivre votre demande.`,
        buttons: [
          {
            url: magicLink,
            label: "Voir l'état de ma demande",
          },
        ],
        subContent: `
      ${defaultSignature(internshipKind)}
      `,
      }),
    },
    NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION: {
      niceName: "Convention - Demande de signature après modification",
      tags: ["demande signature demande de convention après modification"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        conventionSignShortlink,
        internshipKind,
        justification: reason,
        signatoryFirstName,
        signatoryLastName,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? "Pour action : demande de convention modifiée, signez la nouvelle version"
            : "Pour action : demande de mini stage modifiée, signez la nouvelle version",
        greetings: `
        <strong>Identifiant de la convention : ${conventionId}</strong>
        
        Bonjour ${signatoryFirstName} ${signatoryLastName},`,
        content: `La demande de convention pour ${
          internshipKind === "immersion" ? "l'immersion" : "le mini stage"
        }
        de ${beneficiaryFirstName} ${beneficiaryLastName} au sein de ${businessName} vient d'être modifiée.
        
        <strong>Les raisons sont&nbsp;:</strong>
        ${reason}
        
        Votre signature sur la première demande de convention a donc été annulée.
        
        Action attendue : cliquez sur le bouton ci-dessous, puis vérifiez dans l’écran qui s’ouvre si ce qui a été modifié vous convient :
        - Si c'est la cas, confirmez votre accord en signant de nouveau cette demande (cliquez sur “Signer” puis “Je termine la signature” sur l’écran suivant).
        - Si la modification ne vous convient pas, vous pouvez relancer des modifications (cliquez sur le bouton "Annuler les signatures et demander une modification").`,
        buttons: [
          {
            url: conventionSignShortlink,
            label: "Relire et signer la demande de convention",
          },
        ],
        subContent: defaultSignature(internshipKind),
        agencyLogoUrl,
      }),
    },
    REJECTED_CONVENTION_NOTIFICATION: {
      niceName: "Convention - Rejetée",
      tags: ["refus demande d'immersion"],
      createEmailVariables: ({
        agencyLogoUrl,
        agencyName,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        immersionProfession,
        internshipKind,
        rejectionReason,
        signature,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Refus de la demande d'immersion pour observer l'activité de ${immersionProfession} au sein de ${businessName}`
            : `Mini Stage - Refus de la demande de mini stage pour l'activité de ${immersionProfession} au sein de ${businessName}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      Nous vous informons que la demande ${
        internshipKind === "immersion"
          ? "d'immersion professionnelle"
          : "de mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName} a été refusée par ${agencyName}.
      
      <strong>Les raisons sont&nbsp;:</strong>
      ${rejectionReason}       
      
      Vous pouvez vous rapprocher de votre conseiller${
        internshipKind === "immersion"
          ? ""
          : " de la Chambre consulaire ayant émis la convention"
      } pour en échanger.      
      
      Bien cordialement,       
      ${signature} 
      `,
        agencyLogoUrl,
      }),
    },
    CANCELLED_CONVENTION_NOTIFICATION: {
      niceName: "Convention - Annulée",
      tags: ["annulation demande d'immersion"],
      createEmailVariables: ({
        agencyLogoUrl,
        agencyName,
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        immersionProfession,
        internshipKind,
        signature,
        dateEnd,
        dateStart,
        justification,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Annulation de la demande d'immersion pour observer l'activité de ${immersionProfession} au sein de ${businessName}`
            : `Mini Stage - Annulation de la demande de mini stage pour l'activité de ${immersionProfession} au sein de ${businessName}`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      Nous vous informons que la demande ${
        internshipKind === "immersion"
          ? "d'immersion professionnelle"
          : "de mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} dans l'entreprise ${businessName}, qui devait se dérouler du ${
        isStringDate(dateStart)
          ? toDisplayedDate({ date: new Date(dateStart) })
          : "DATE INVALIDE"
      } au ${
        isStringDate(dateEnd)
          ? toDisplayedDate({ date: new Date(dateEnd) })
          : "DATE INVALIDE"
      } a été annulée par ${agencyName}.
      
      La demande a été annulée pour la raison suivante :
      
      ${justification}
      
      Vous pouvez vous rapprocher de votre conseiller${
        internshipKind === "immersion"
          ? ""
          : " de la Chambre consulaire ayant émis la convention"
      } pour en échanger ou établir une nouvelle demande si nécessaire.      
      
      Bien cordialement,       
      ${signature} 
      `,
        agencyLogoUrl,
      }),
    },
    DEPRECATED_CONVENTION_NOTIFICATION: {
      niceName: "Convention - Obsolète",
      tags: ["dépreciation demande d'immersion"],
      createEmailVariables: ({
        beneficiaryFirstName,
        beneficiaryLastName,
        businessName,
        conventionId,
        dateEnd,
        dateStart,
        deprecationReason,
        immersionProfession,
        internshipKind,
      }) => ({
        subject:
          internshipKind === "immersion"
            ? `Demande d'immersion pour observer l'activité de ${immersionProfession} au sein de ${businessName} obsolète`
            : `Mini Stage - Demande de mini stage pour l'activité de ${immersionProfession} au sein de ${businessName} obsolète`,
        greetings: greetingsWithConventionId(conventionId),
        content: `
      Nous vous informons que la demande ${
        internshipKind === "immersion"
          ? "d'immersion professionnelle"
          : "de mini stage"
      } de ${beneficiaryFirstName} ${beneficiaryLastName} pour réaliser ${
        internshipKind === "immersion"
          ? "une immersion professionnelle"
          : "un mini stage"
      } du ${
        isStringDate(dateStart)
          ? toDisplayedDate({
              date: new Date(dateStart),
            })
          : "DATE INVALIDE"
      } au ${
        isStringDate(dateEnd)
          ? toDisplayedDate({ date: new Date(dateEnd) })
          : "DATE INVALIDE"
      } dans l'entreprise ${businessName} est supprimée.
      
      Les raisons en sont: ${deprecationReason}.         
      
      Bien cordialement,       
      `,
        subContent: defaultSignature(internshipKind),
      }),
    },

    MAGIC_LINK_RENEWAL: {
      niceName: "Convention - Renouvellement de lien magique",
      tags: ["renouvellement de lien"],
      createEmailVariables: ({ conventionId, internshipKind, magicLink }) => ({
        subject:
          internshipKind === "immersion"
            ? "Voici votre nouveau lien magique pour accéder à la demande d'immersion"
            : "Mini Stage - Voici votre nouveau lien magique pour accéder à la demande de mini stage",
        greetings: conventionId
          ? greetingsWithConventionId(conventionId)
          : "Bonjour ,",
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
        ],
        subContent: defaultSignature(internshipKind),
        highlight: {
          content:
            "Si vous n'êtes pas à l'origine de cette demande, veuillez contacter notre équipe.",
        },
      }),
    },

    AGENCY_OF_TYPE_OTHER_ADDED: {
      niceName: "Délégation - Agence de type autre ajoutée",
      tags: ["Agence de type autre ajoutée"],
      createEmailVariables: ({ agencyLogoUrl, agencyName }) => ({
        subject: "Immersion Facilitée - Votre structure a été activée",
        greetings: "Bonjour,",
        content: `Vous recevez cet email suite à votre demande de référencement sur le site Immersion Facilitée. 
        Afin de finaliser le référencement de votre structure ${agencyName}, 
        envoyez-nous votre convention de délégation au format pdf à l'adresse : <a href= "mailto:${immersionFacileDelegationEmail}" target="_blank">${immersionFacileDelegationEmail}</a> 
        `,
        agencyLogoUrl,
        highlight: {
          content:
            "Attention : votre structure ne sera activée qu'à la réception de la convention de délégation ! ",
        },
        subContent: defaultSignature("immersion"),
      }),
    },
    AGENCY_DELEGATION_CONTACT_INFORMATION: {
      niceName: "Délégation - Information de contact DR",
      tags: [
        "Transmision des informations de contact des DR aux agences sans délégation",
      ],
      createEmailVariables: ({
        firstName,
        lastName,
        agencyName,
        agencyProvince,
        delegationProviderMail,
      }) => ({
        subject:
          "Envoyez la demande de délégation à votre Direction régionale France Travail !",
        greetings: `Bonjour ${firstName} ${lastName},`,
        content: `
        Vous recevez cet email suite à votre demande de référencement sur le site Immersion Facilitée.
        Afin de référencer votre structure ${agencyName} située dans la région ${agencyProvince}, vous devez demander une convention de délégation par email au prescripteur de droit dont votre structure dépend.
        Votre structure dépend de la DR ${agencyProvince}, contactez-les par email  : <a href= "mailto:${delegationProviderMail}" target="_blank">${delegationProviderMail}</a>
      `,
        highlight: {
          content:
            "Pour formuler votre demande, nous vous invitons à la motiver en précisant le type de public que vous accompagnez, la raison pour laquelle vous souhaitez mobiliser l'immersion professionnelle et le territoire sur lequel vous agissez (régional, départemental).",
        },
        subContent: defaultSignature("immersion"),
      }),
    },
    AGENCY_WAS_ACTIVATED: {
      niceName: "Agence - Activée",
      tags: ["activation prescripteur"],
      createEmailVariables: ({
        agencyLogoUrl,
        agencyName,
        refersToOtherAgency,
        users,
        agencyReferdToName,
      }) => ({
        subject: "Immersion Facilitée - Votre structure a été activée",
        greetings: "Bonjour,",
        content: `<strong>Votre ${
          refersToOtherAgency
            ? `structure d'accompagnement`
            : "organisme prescripteur"
        } ${agencyName} est activée sur Immersion facilitée !</strong> 

        Vous pouvez dès à présent valider les conventions dématérialisées sur Immersion Facilitée.

        <strong>Voici les différents utilisateurs rattachés à la structure et leur rôles :</strong>

        Chaque utilisateur peut se créer un espace personnel afin de voir${
          refersToOtherAgency
            ? " ou pré-valider"
            : ", pré-valider ou valider et piloter"
        } ses conventions, en fonction de ses droits.
        ${
          refersToOtherAgency &&
          `Les conventions devront ensuite être validées par l’un des validateurs de votre organisme prescripteur lié : ${agencyReferdToName}.`
        }
        ${users
          .map(
            ({
              firstName,
              lastName,
              email,
              agencyName,
              isNotifiedByEmail,
              roles,
            }) =>
              generateUserInfo(
                firstName,
                lastName,
                email,
                roles,
                isNotifiedByEmail,
                agencyName,
              ),
          )
          .join("")}
 

        Participez à notre webinaire de 30 min pour découvrir Immersion Facilitée.

        Au programme :
          • Le moteur de recherche pour trouver une entreprise accueillante
          • Comment compléter une convention d'immersion
          • Découvrir l'espace prescripteur - piloter les conventions
        `,
        buttons: [
          {
            label: "Je m'inscris au webinaire",
            url: "https://app.livestorm.co/itou/prescripteur-utiliser-le-site-dimmersion-facilitee?utm_source=if&utm_medium=mail&utm_campaign=transac-activation",
          },
        ],
        agencyLogoUrl,
        subContent: defaultSignature("immersion"),
        attachmentUrls: [
          "https://immersion.cellar-c2.services.clever-cloud.com/Fiche memo prescripteur-Role-des-prescripteurs-et-couverture-des risques-immersionfacilitee2024.pdf",
        ],
      }),
    },
    AGENCY_WITH_REFERS_TO_ACTIVATED: {
      niceName:
        "Agence - notification de l'agence prescriptrice lors de l'activation d'une agence accompagnatrice",
      tags: [
        "notification agence prescriptrice activation agence accompagnatrice",
      ],
      createEmailVariables: ({
        nameOfAgencyRefering,
        refersToAgencyName,
        agencyLogoUrl,
        ...rest
      }) => ({
        subject:
          "Une structure d'accompagnement qui vous a désigné comme structure prescriptrice a été activée",
        greetings: "Bonjour,",
        content: `La structure d'accompagnement ${nameOfAgencyRefering} est activée sur Immersion facilitée.
        Elle a désigné comme prescripteur votre propre structure « ${refersToAgencyName} ».
        
        Cela signifie que vous allez recevoir des demandes de conventions initiées par des candidats ou entreprises qui sont accompagnés par la structure d'accompagnement ${nameOfAgencyRefering}.
        Ces demandes seront toutes examinées en premier lieu par la structure d'accompagnement. Si celle-ci confirme leur pertinence, vous les recevrez pour validation définitive (validées par ${rest.validatorEmails.join(
          ", ",
        )}).
        
        L'accompagnement lors du déroulement de l'immersion et du bilan relève de la responsabilité de la structure d'accompagnement.
        
        Merci à vous !`,
        agencyLogoUrl,
        subContent: defaultSignature("immersion"),
      }),
    },
    AGENCY_WAS_REJECTED: {
      niceName: "Agence - Refusée",
      tags: ["rejet prescripteur"],
      createEmailVariables: ({ agencyName, rejectionJustification }) => ({
        subject: `Rejet de ${agencyName} comme structure prescriptrice`,
        greetings: "Bonjour,",
        content: `La demande d'activation de : ${agencyName} sur Immersion Facilitée comme prescripteur a été refusée pour les raisons suivantes : ${rejectionJustification}.

Pour toute question concernant ce rejet, il est possible de nous contacter : contact@immersion-facile.beta.gouv.fr`,
        subContent: defaultSignature("immersion"),
      }),
    },
    IC_USER_RIGHTS_HAS_CHANGED: {
      niceName: "Inclusion Connect - Changement de droit sur agence",
      tags: ["activation BO prescripteur"],
      createEmailVariables: ({
        agencyName,
        isNotifiedByEmail,
        roles,
        firstName,
        lastName,
        email,
      }) => ({
        subject:
          "Immersion Facilitée - Activation de l’accès au back office de votre structure",
        greetings: `Bonjour ${firstName} ${lastName},`,
        content: `
        Vous pouvez désormais accéder au tableau de bord de votre structure&nbsp: ${agencyName}.

        <strong>Voici le récapitulatif de votre profil utilisateur :</strong>
        ${generateUserInfo(
          firstName,
          lastName,
          email,
          roles,
          isNotifiedByEmail,
          agencyName,
        )}
      `,
        subContent: defaultSignature("immersion"),
      }),
    },
    IC_USER_REGISTRATION_TO_AGENCY_REJECTED: {
      niceName: "Inclusion Connect - Rejet de rattachement a une agence",
      tags: ["rejet de rattachement a une agence"],
      createEmailVariables: ({ agencyName, justification }) => ({
        subject:
          "Immersion Facilitée - Refus de la demande d’accès au tableau de bord",
        greetings: "Bonjour,",
        content: `<strong>Votre demande d’accès au tableau de bord a été rejetée.</strong>

        Votre demande d'accès au tableau de bord des conventions d'immersion de la structure : ${agencyName} a été refusée par l'administrateur d'Immersion Facilitée pour les raisons suivantes : ${justification}. 
      `,
        subContent: defaultSignature("immersion"),
      }),
    },

    NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: {
      niceName: "Établissement - Référencement réussie",
      tags: ["confirmation enregistrement entreprise"],
      createEmailVariables: ({
        businessName,
        businessAddresses,
        contactFirstName,
        contactLastName,
      }) => ({
        subject: `Confirmation de création de votre établissement ${businessName} pour accueillir des immersions`,
        greetings: "Bonjour,",
        content: `
      <strong>Félicitations !</strong>

      Vous venez d'enregistrer votre établissement ${businessName} (${
        businessAddresses[0]
      }) pour accueillir des immersions professionnelles.      

      ${contactFirstName} ${contactLastName} recevra bien les demandes d'immersion.
      
      Votre entreprise sera visible sur notre moteur de recherche sur les lieux d'immersion suivants :      
      ${businessAddresses.map((address) => `• ${address}\n`).join("")}
      Pour ces demandes, il n'est pas utile de demander un CV. Il s'agit seulement de passer quelques jours ensemble pour une découverte réciproque. 

      Si vous avez des projets de recrutement et si, grâce à une immersion, vous retenez un profil qui vous convient, un conseiller emploi vous proposera, si nécessaire,  un plan de formation sur mesure. 

      Merci d'avoir rejoint la communauté des “entreprises s'engagent” et de contribuer ainsi à l'accès à l'emploi de tous les publics.
      `,
        subContent: defaultSignature("immersion"),
        buttons: [
          {
            label: "Nos bons conseils",
            url: "https://immersion.cellar-c2.services.clever-cloud.com/Fiche memo-entreprise accueillante-immersion facilitee 2024.pdf",
          },
        ],
      }),
    },
    SUGGEST_EDIT_FORM_ESTABLISHMENT: {
      niceName: "Établissement - Suggestion de mise à jour",
      tags: ["mise à jour fiche entreprise"],
      createEmailVariables: ({
        editFrontUrl,
        businessName,
        businessAddresses,
      }) => ({
        subject:
          "Mettez à jour votre fiche entreprise sur le site Immersion Facilitée",
        greetings: "Bonjour,",
        content: `Votre entreprise: ${businessName} (${businessAddresses[0]}) est inscrite dans l'annuaire des entreprises accueillantes d'Immersion Facilitée depuis au moins 6 mois. Merci !

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
          {
            label: "Mettre à jour ma fiche établissement",
            url: `${editFrontUrl}&shouldUpdateAvailability=true&mtm_campaign=transactionnel-etablissement-suggestion-mise-a-jour`,
          },
        ],
      }),
    },
    ESTABLISHMENT_DELETED: {
      niceName: "Établissement - Supprimé",
      tags: ["suppression entreprise"],
      createEmailVariables: ({ businessAddresses, businessName, siret }) => ({
        subject:
          "Votre entreprise a été supprimée de la liste des entreprises accueillantes d'Immersion Facilitée",
        greetings: "Bonjour,",
        content: `
        Suite à votre demande de suppression de votre établissement (SIRET ${siret} - ${businessName} - ${businessAddresses[0]}), nous vous confirmons que ce dernier a été supprimé définitivement de la liste des entreprises accueillantes exposées sur Immersion Facilitée.
        `,
        subContent: `Bien cordialement,
        l'équipe d'Immersion Facilitée`,
      }),
    },
    ESTABLISHMENT_USER_RIGHTS_UPDATED: {
      niceName: "Compte - Etablissement - Modification d’un utilisateur",
      tags: ["compte_etablissement_modificationUtilisateur"],
      createEmailVariables: ({
        businessName,
        updatedRole,
        firstName,
        lastName,
        triggeredByUserFirstName,
        triggeredByUserLastName,
      }) => ({
        subject: "Votre rôle sur Immersion Facilitée a été mis à jour",
        greetings: `Bonjour ${firstName} ${lastName},`,
        content: `
          Votre rôle sur Immersion Facilitée pour l'établissement <strong>${businessName}</strong> a été modifié par ${triggeredByUserFirstName} ${triggeredByUserLastName}.
          
          <strong>Votre nouveau rôle :</strong> ${updatedRole === "establishment-admin" ? "Administrateur" : "Contact"}
          
          ${
            updatedRole
              ? `L'administrateur accède aux conventions, aux candidatures (lecture et réponse) et peut gérer la fiche entreprise et les utilisateurs de l'établissement.`
              : `Le contact accède aux conventions et aux candidatures (lecture et réponse) de l'établissement.`
          }

          Si cette modification ne vous semble pas justifiée, contactez ${triggeredByUserFirstName} ${triggeredByUserLastName} ou notre support.
        `,
        subContent: defaultSignature("immersion"),
      }),
    },
    ESTABLISHMENT_USER_RIGHTS_ADDED: {
      niceName: "Compte - Etablissement - Ajout d’un utilisateur",
      tags: ["compte_etablissement_ajoutUtilisateur"],
      createEmailVariables: ({
        businessName,
        role,
        firstName,
        lastName,
        triggeredByUserFirstName,
        triggeredByUserLastName,
      }) => ({
        subject: `Votre accès ${businessName} sur Immersion Facilitée`,
        greetings: `Bonjour ${firstName && lastName ? `${firstName} ${lastName}` : ""},`,
        content: `
          Vous avez été ajouté(e) comme ${role === "establishment-admin" ? "administrateur" : "contact"} sur Immersion Facilitée pour l’établissement ${businessName} par ${triggeredByUserFirstName} ${triggeredByUserLastName}.

          ${
            role === "establishment-admin"
              ? "L’administrateur accède aux conventions, aux candidatures (lecture et réponse) et peut gérer la fiche entreprise et les utilisateurs de l’établissement."
              : "Le contact accède aux conventions et aux candidatures (lecture et réponse) de l’établissement."
          }

          Créez votre compte dès maintenant pour accéder à votre espace :
        `,
        buttons: [
          {
            label: "Créer mon compte",
            url: `${frontRoutes.establishmentDashboard}`,
          },
        ],
        subContent: defaultSignature("immersion"),
      }),
    },
    CONTACT_BY_EMAIL_REQUEST: {
      niceName: "Établissement - Mise en relation par mail",
      tags: ["mise en relation mail"],
      createEmailVariables: (params) => ({
        subject: `${params.potentialBeneficiaryFirstName} ${params.potentialBeneficiaryLastName} vous contacte pour une demande d'immersion sur le métier de ${params.appellationLabel}`,
        greetings: `Bonjour ${params.contactFirstName} ${params.contactLastName},`,
        content: `Un candidat souhaite faire une immersion dans votre entreprise ${params.businessName} (${params.businessAddress}).

Immersion souhaitée :

    • Métier : ${params.appellationLabel}.
    • Dates d’immersion envisagées : ${params.potentialBeneficiaryDatePreferences}.
    • ${
      params.immersionObjective
        ? `But de l'immersion : ${labelsForImmersionObjective[params.immersionObjective]}.`
        : ""
    }

Profil du candidat :

    ${
      params.kind === "IF" && params.potentialBeneficiaryHasWorkingExperience
        ? "• Expérience professionnelle : J’ai déjà une ou plusieurs expériences professionnelles, ou de bénévolat"
        : "• Expérience professionnelle : je n’ai jamais travaillé"
    }.
    ${
      params.kind === "IF" &&
      params.potentialBeneficiaryExperienceAdditionalInformation
        ? `• Informations supplémentaires sur l'expérience du candidat : ${params.potentialBeneficiaryExperienceAdditionalInformation}.`
        : ""
    }
    ${
      params.kind === "1_ELEVE_1_STAGE" && params.levelOfEducation
        ? `• Je suis en ${params.levelOfEducation}.`
        : ""
    }
    ${
      params.kind === "IF" && params.potentialBeneficiaryResumeLink
        ? `• CV du candidat : ${params.potentialBeneficiaryResumeLink}.`
        : ""
    }`,
        buttons: [
          {
            label: "Répondre au candidat via mon espace",
            target: "_blank",
            url: `https://${params.domain}/${frontRoutes.establishmentDashboard}/discussions?discussionId=${params.discussionId}&mtm_campaign=inbound-parsing-reponse-via-espace-entreprise&mtm_kwd=inbound-parsing-reponse-via-espace-entreprise`,
          },
        ],
        highlight: {
          content: `
          Ce candidat attend une réponse, vous pouvez :

          - répondre directement à cet email, il lui sera transmis (vous pouvez également utiliser le bouton ci-dessus)

          - en cas d'absence de réponse par email, vous pouvez essayer de le contacter par tel : ${params.potentialBeneficiaryPhone}`,
        },
        subContent: `<strong>Si la connexion ne fonctionne pas et que vous ne recevez pas le lien de réinitialisation du mot de passe, c'est que vous n'avez pas encore créé votre compte</strong>.
        Créer votre compte avec le même mail que celui avec lequel les candidats vous contactent.

        ${defaultSignature("immersion")}`,
      }),
    },
    CONTACT_BY_EMAIL_CANDIDATE_CONFIRMATION: {
      niceName: "Candidat - Confirmation de la demande de contact",
      tags: [""],
      createEmailVariables: ({ kind, beneficiaryFullName, businessName }) => ({
        subject: ` Immersion Facilitée - Confirmation de l’envoi de votre candidature auprès de ${businessName}`,
        greetings: `Bonjour ${beneficiaryFullName},`,
        content: `<strong>Nous vous confirmons que votre candidature pour ${kind === "IF" ? "une immersion professionnelle" : "un stage"} a bien été transmise à ${businessName}</strong>. L'entreprise doit maintenant examiner votre demande.

          Si l'entreprise accepte, elle vous contactera pour discuter des détails de votre ${kind === "IF" ? "immersion" : "stage"}.
          
          <strong>Comment maximiser vos chances ?</strong>
          • Si l'entreprise ne répond pas sous <strong>15 jours</strong>, appelez-la directement.
          • Postulez à au moins <strong>3 entreprises</strong> pour multiplier vos opportunités.
          
          Les entreprises ne répondent pas toujours, mais cela ne remet pas en cause votre valeur. Gardez confiance !
          
          Si vous avez besoin d'aide pour préparer votre relance, n'hésitez pas à contacter votre conseiller.
          
          Bonne chance pour la suite de vos démarches ! Nous restons à votre disposition.
        `,
      }),
    },
    CONTACT_BY_EMAIL_REQUEST_LEGACY: {
      niceName: "Établissement - Mise en relation par mail",
      tags: ["mise en relation mail"],
      createEmailVariables: ({
        appellationLabel,
        businessName,
        contactFirstName,
        contactLastName,
        immersionObjective,
        message,
        potentialBeneficiaryFirstName,
        potentialBeneficiaryLastName,
        businessAddress,
        potentialBeneficiaryPhone,
        potentialBeneficiaryResumeLink,
        replyToEmail,
      }) => ({
        subject: `${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName} vous contacte pour une demande d'immersion sur le métier de ${appellationLabel}`,
        greetings: `Bonjour ${contactFirstName} ${contactLastName},`,
        content: `
        Un candidat souhaite faire une immersion ${
          immersionObjective
            ? `pour "${immersionObjective?.toLowerCase()}"`
            : ""
        } sur le métier de <strong>${appellationLabel}</strong> dans votre entreprise ${businessName} (${businessAddress}).

        Voici son message:

      "${message}"

      ${potentialBeneficiaryFirstName} 
      ${potentialBeneficiaryLastName}

      ${
        potentialBeneficiaryResumeLink
          ? `Plus d'info sur ce candidat: <a href="${potentialBeneficiaryResumeLink}">${potentialBeneficiaryResumeLink}</a>`
          : ""
      }
      
      `,
        buttons: [
          {
            label: "Écrire au candidat",
            url: `mailto:${replyToEmail}`,
          },
        ],
        highlight: {
          content: `
          Ce candidat attend une réponse, vous pouvez :

          - répondre directement à cet email, il lui sera transmis (vous pouvez également utiliser le bouton "Écrire au candidat" ci-dessus)

          - en cas d'absence de réponse par email, vous pouvez essayer de le contacter par tel : ${potentialBeneficiaryPhone}`,
        },
        subContent: `Vous pouvez préparer votre échange grâce à notre <a href="https://immersion-facile.beta.gouv.fr/aide/article/etudier-une-demande-dimmersion-professionnelle-1ehkehm/">page d'aide</a>.
        ${defaultSignature("immersion")}`,
      }),
    },
    CONTACT_BY_PHONE_INSTRUCTIONS: {
      niceName: "Établissement - Indication de mise en relation par téléphone",
      tags: ["mise en relation tel"],
      createEmailVariables: ({
        businessName,
        contactFirstName,
        contactLastName,
        contactPhone,
        kind,
        potentialBeneficiaryFirstName,
        potentialBeneficiaryLastName,
      }) => ({
        subject: `Coordonnées téléphoniques pour faire votre demande ${kind === "IF" ? "d'immersion" : "de stage"}`,
        greetings: `Bonjour ${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName},`,
        content: `
      Vous avez manifesté de l’intérêt pour réaliser ${kind === "IF" ? "une immersion professionnelle" : "un stage"} au sein de l’entreprise ${businessName}.
      Cette entreprise a souhaité être contactée par téléphone.

      Voici ses coordonnées :
      - Personne à contacter : ${contactFirstName} ${contactLastName}
      - Numéro de téléphone  :  ${contactPhone}      
      
      Ces informations sont personnelles et confidentielles. Elles ne peuvent pas être communiquées à d’autres personnes. 
      Merci !

      ${kind === "IF" ? advices : ""}
      `,
      }),
    },
    CONTACT_IN_PERSON_INSTRUCTIONS: {
      niceName: "Établissement - Indication de mise en relation en personne",
      tags: ["mise en relation en personne"],
      createEmailVariables: ({
        businessAddress,
        businessName,
        contactFirstName,
        contactLastName,
        kind,
        potentialBeneficiaryFirstName,
        potentialBeneficiaryLastName,
      }) => ({
        subject: `Coordonnées de l'entreprise pour faire votre demande ${kind === "IF" ? "d'immersion" : "de stage"}`,
        greetings: `Bonjour ${potentialBeneficiaryFirstName} ${potentialBeneficiaryLastName},`,
        content: `Vous avez manifesté de l’intérêt pour réaliser ${kind === "IF" ? "une immersion professionnelle" : "un stage"} au sein de l’entreprise ${businessName}.

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

    DISCUSSION_EXCHANGE: {
      niceName:
        "Établissement - Échange entre établissement et potentiel bénéficiaire",
      tags: ["échange établissement potentiel bénéficiaire"],
      createEmailVariables: ({ subject, htmlContent }) => ({
        bypassLayout: true,
        subject,
        content: htmlContent,
      }),
    },
    WARN_DISCUSSION_DELIVERY_FAILED: {
      niceName:
        "Établissement - Alerte de problème d'envoi d'un échange dans une discussion",
      tags: ["envoi impossible"],
      createEmailVariables: ({ recipientsInEmailInError, errorMessage }) => ({
        bypassLayout: true,
        subject: "Échec d'envoi d'email",
        content: `
        <p>Bonjour,</p>
        <p>Votre email n'a pas pu être envoyé. Nous avons rencontré l'erreur suivante :</p>
        
        <p>${errorMessage}</p>
        
        <p>Les destinataires suivants n'ont pas reçu l'email :</p>
        <ul>
          ${recipientsInEmailInError.map((recipient) => `<li>${recipient}</li>`).join("")}
        </ul>
        
        <p>Vous pouvez essayer de renvoyer l'email en évitant les pièces jointes (ou bien en utilisant uniquement des formats pdf ou des images).</p>

        Bonne journée,
        <br/>
        L'équipe Immersion Facile`,
      }),
    },
    FULL_PREVIEW_EMAIL: {
      niceName: "Tech - Preview email complet (tous les blocs)",
      tags: ["aperçu pour tests"],
      createEmailVariables: ({
        agencyLogoUrl,
        beneficiaryName,
        conventionId,
        internshipKind,
      }) => ({
        subject: "Test contenant toutes les blocs email",
        greetings: greetingsWithConventionId(conventionId, beneficiaryName),
        content: `Merci d'avoir confirmé votre demande ${
          internshipKind ? "d'immersion" : "de mini stage"
        }. Elle va être transmise à votre ${
          internshipKind === "immersion"
            ? "conseiller"
            : "conseiller de la Chambre consulaire ayant émis la convention"
        } référent.
      
      Il vous informera par mail de la validation ou non ${
        internshipKind === "immersion" ? "de l'immersion" : "du mini stage"
      }. Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.`,
        legals: defaultConventionFinalLegals(internshipKind),
        buttons: [{ label: "Label de bouton", url: "http://www.example.com" }],
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

    ESTABLISHMENT_LEAD_REMINDER: {
      niceName: "Establishment Lead - Premier rappel d'inscription",
      tags: ["relance inscription prospect"],
      createEmailVariables: ({
        businessName,
        registerEstablishmentShortLink,
        unsubscribeToEmailShortLink,
      }) => ({
        subject:
          "Votre Immersion s'est bien passée ? Accueillez d'autres candidats quand vous le voulez !",
        greetings: "Bonjour,",
        content: `
        Nous sommes ravis que votre entreprise ${businessName} ait choisi l'immersion professionnelle pour faire découvrir votre métier et votre établissement.

        Préparez dès maintenant l'accueil de votre prochain candidat en devenant entreprise accueillante sur le site Immersion Facilitée.

        Être entreprise accueillante vous permet de gérer votre visibilité sur la plateforme pour recevoir des demandes d'immersion, à votre rythme, et en fonction de vos disponibilités.

        Devenez entreprise accueillante dès aujourd'hui.`,
        buttons: [
          {
            label: "S'inscrire en 2 minutes !",
            url: registerEstablishmentShortLink,
          },
        ],
        subContent: `Bonne journée,
      L'équipe Immersion Facilitée`,
        legals: `<a href=${unsubscribeToEmailShortLink}>Je ne souhaite pas devenir entreprise accueillante</a>`,
      }),
    },
  });

const greetingsWithConventionId = (
  conventionId: ConventionId,
  actor?: string,
): string =>
  `<strong>Identifiant de la convention : ${conventionId}</strong>
        
Bonjour${actor ? ` ${actor}` : ""},`;

const descriptionByRole: Record<AgencyRole, string> = {
  validator:
    "<strong>Valideur</strong> (peut valider des conventions de l’agence et modifier leur statut)",
  counsellor:
    "<strong>Pré-Valideur</strong> (peut pré-valider les conventions de l’agence et modifier leur statut)",
  "agency-viewer":
    "<strong>Lecteur</strong> (peut consulter les conventions de l’agence)",
  "agency-admin":
    "<strong>Administrateur</strong> (Peut modifier les informations de l’agence, ajouter et supprimer des utilisateurs, modifier leurs rôles, consulter les conventions)",
  "to-review":
    "<strong>À valider</strong> (Souhaite être rattaché à l'organisme)",
};

const generateUserInfo = (
  firstName: string,
  lastName: string,
  email: string,
  roles: AgencyRole[],
  isNotified: boolean,
  agencyName: string,
): string => {
  const rolesDescriptionList = roles
    .filter((role) => role !== "to-review")
    .map((role) => `<li>${descriptionByRole[role]}</li>`)
    .join("\n");

  const nameDisplay =
    firstName && lastName ? `${firstName} ${lastName} - ${email}` : email;

  return `
    <ul style="list-style-type: none; border: 1px solid #ddd; padding: 16px;"><li><strong>${nameDisplay}</strong></li>
      ${rolesDescriptionList}
      <li>${
        isNotified
          ? "Reçoit les emails de toutes les conventions de "
          : "Ne reçoit aucun email pour "
      } ${agencyName}</li>
      <li><a href="https://immersion-facile.beta.gouv.fr/tableau-de-bord-agence" target="_blank">Espace personnel</a></li></ul>
  `;
};
