#!/bin/bash
# ---------------------------------------------------------
# IMPORTATION : Itération (Sprint) - OPTIMISÉ ET SÉCURISÉ
# ---------------------------------------------------------
ORG="Immersion-Facilitee"
PROJ_NUM=1
FILE="export_p10.json"
FIELD_NAME_FILE="sprint"     # Le nom du champ dans le JSON (souvent en minuscules)
FIELD_NAME_PROJET="Sprint"   # Le nom du champ dans le Projet GitHub

echo "⏳ Mise en cache de la configuration du projet (pour économiser l'API)..."
PROJ_ID=$(gh project view $PROJ_NUM --owner "$ORG" --format json | jq -r '.id')

# ⚠️ OPTIMISATION : On télécharge le JSON des champs 1 seule fois
FIELDS_JSON=$(gh project field-list $PROJ_NUM --owner "$ORG" --format json)
FIELD_ID=$(echo "$FIELDS_JSON" | jq -r ".fields[] | select(.name == \"$FIELD_NAME_PROJET\") | .id")

echo "🚀 Démarrage de l'importation (avec pause anti-spam)..."

jq -c '.items[]' "$FILE" | while read -r item; do
  URL=$(echo "$item" | jq -r '.content.url // empty')
  
  # Lecture de la valeur (on extrait la propriété 'title' de l'objet sprint)
  VALUE=$(echo "$item" | jq -r ".\"$FIELD_NAME_FILE\".title // empty")

  if [ -n "$URL" ] && [ -n "$VALUE" ] && [ "$VALUE" != "null" ]; then
    
    # 1. Ajout sécurisé
    ITEM_ID=$(gh project item-add $PROJ_NUM --owner "$ORG" --url "$URL" --format json 2>/dev/null | jq -r '.id')
    
    if [ -n "$ITEM_ID" ] && [ "$ITEM_ID" != "null" ]; then
      
      # 2. ⚠️ OPTIMISATION : On cherche l'ID du sprint dans la variable locale FIELDS_JSON (aucune requête API !)
      ITER_ID=$(echo "$FIELDS_JSON" | jq -r ".fields[] | select(.name == \"$FIELD_NAME_PROJET\") | .configuration.iterations[] | select(.title == \"$VALUE\") | .id")

      if [ -n "$ITER_ID" ] && [ "$ITER_ID" != "null" ]; then
        # 3. Modification avec --iteration-id
        gh project item-edit --id "$ITEM_ID" --project-id "$PROJ_ID" --field-id "$FIELD_ID" --iteration-id "$ITER_ID" > /dev/null
        echo "✅ $URL -> $FIELD_NAME_PROJET : $VALUE"
      else
        echo "⚠️ Sprint '$VALUE' introuvable dans le nouveau projet (vérifiez qu'il a bien été créé)."
      fi
    else
      echo "❌ Erreur lors de l'ajout au projet pour : $URL"
    fi
    
    # ⏳ PAUSE ANTI-SPAM (1 seconde)
    sleep 1
  else
    echo "❌ $URL - Pas de champ $FIELD_NAME_FILE"
  fi
done