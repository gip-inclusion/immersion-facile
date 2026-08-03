#!/bin/bash
# ---------------------------------------------------------
# IMPORTATION : Single Select (Choix unique) - OPTIMISÉ
# ---------------------------------------------------------
ORG="Immersion-Facilitee"
PROJ_NUM=1
FILE="export_p10.json"
FIELD_NAME_FILE="conformité"
FIELD_NAME_PROJET="Conformité"

echo "⏳ Mise en cache de la configuration du projet (pour économiser l'API)..."
PROJ_ID=$(gh project view $PROJ_NUM --owner "$ORG" --format json | jq -r '.id')

# On télécharge TOUT le JSON des champs 1 seule fois et on le stocke en mémoire
FIELDS_JSON=$(gh project field-list $PROJ_NUM --owner "$ORG" --format json)
FIELD_ID=$(echo "$FIELDS_JSON" | jq -r ".fields[] | select(.name == \"$FIELD_NAME_PROJET\") | .id")

echo "🚀 Démarrage de l'importation (avec pause anti-spam)..."

jq -c '.items[]' "$FILE" | while read -r item; do
  URL=$(echo "$item" | jq -r '.content.url // empty')
  VALUE=$(echo "$item" | jq -r ".\"$FIELD_NAME_FILE\" // empty")

  if [ -n "$URL" ] && [ -n "$VALUE" ] && [ "$VALUE" != "null" ]; then
    ITEM_ID=$(gh project item-add $PROJ_NUM --owner "$ORG" --url "$URL" --format json 2>/dev/null | jq -r '.id')
    
    if [ -n "$ITEM_ID" ] && [ "$ITEM_ID" != "null" ]; then
      
      # ⚠️ OPTIMISATION : On lit l'ID de l'option en local dans le JSON en mémoire (0 requête API !)
      OPTION_ID=$(echo "$FIELDS_JSON" | jq -r ".fields[] | select(.name == \"$FIELD_NAME_PROJET\") | .options[] | select(.name == \"$VALUE\") | .id")
      
      if [ -n "$OPTION_ID" ] && [ "$OPTION_ID" != "null" ]; then
        gh project item-edit --id "$ITEM_ID" --project-id "$PROJ_ID" --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID" > /dev/null
        echo "✅ $URL -> $FIELD_NAME_PROJET : $VALUE"
      else
        echo "⚠️ Option '$VALUE' introuvable."
      fi
    else
      echo "❌ Erreur ajout : $URL"
    fi
    
    # ⏳ PAUSE ANTI-SPAM DE GITHUB (1 seconde)
    sleep 1
  fi
done