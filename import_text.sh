#!/bin/bash
# ---------------------------------------------------------
# IMPORTATION : Texte - OPTIMISÉ ET SÉCURISÉ
# ---------------------------------------------------------
ORG="Immersion-Facilitee"
PROJ_NUM=2                  # ⚠️ J'ai mis 2 car KPI était sur IF Epics (P13)
FILE="export_p13.json"      # ⚠️ Modifié pour correspondre
FIELD_NAME_FILE="kPI"       # Le nom exact du champ dans le JSON (souvent en minuscules)
FIELD_NAME_PROJET="KPI"     # Le nom exact du champ dans le Projet GitHub

echo "⏳ Préparation du champ $FIELD_NAME_PROJET..."
PROJ_ID=$(gh project view $PROJ_NUM --owner "$ORG" --format json | jq -r '.id')
FIELD_ID=$(gh project field-list $PROJ_NUM --owner "$ORG" --format json | jq -r ".fields[] | select(.name == \"$FIELD_NAME_PROJET\") | .id")

echo "🚀 Démarrage de l'importation (avec pause anti-spam)..."

jq -c '.items[]' "$FILE" | while read -r item; do
  URL=$(echo "$item" | jq -r '.content.url // empty')
  
  # Lecture propre de la valeur
  VALUE=$(echo "$item" | jq -r ".\"$FIELD_NAME_FILE\" // empty")

  if [ -n "$URL" ] && [ -n "$VALUE" ] && [ "$VALUE" != "null" ]; then
    
    # 1. Ajout sécurisé (le 2>/dev/null masque l'erreur dans la console si l'URL bug)
    ITEM_ID=$(gh project item-add $PROJ_NUM --owner "$ORG" --url "$URL" --format json 2>/dev/null | jq -r '.id')
    
    # 2. Vérification qu'on a bien l'ID avant de modifier
    if [ -n "$ITEM_ID" ] && [ "$ITEM_ID" != "null" ]; then
      
      # 3. Modification en mode --text
      gh project item-edit --id "$ITEM_ID" --project-id "$PROJ_ID" --field-id "$FIELD_ID" --text "$VALUE" > /dev/null
      echo "✅ $URL -> $FIELD_NAME_PROJET : $VALUE"
      
    else
      echo "❌ Erreur lors de l'ajout au projet pour : $URL"
    fi
    
    # ⏳ PAUSE ANTI-SPAM (1 seconde)
    sleep 1
  else
    echo "❌ $URL - Pas de champ $FIELD_NAME_FILE"
  fi
done