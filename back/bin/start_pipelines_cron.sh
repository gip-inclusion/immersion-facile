#!/usr/bin/env bash

# Initialization script for the pipelines docker container, to be run at container startup.

echo "Running $0 $@ (pwd: $(pwd))"

# The script uses the following environment variables:
#  LOGDIR (required): the directory in which to keep the log files.
: "${LOGDIR:?Variable not set or empty}"

#  CRONFILE (required): The path at which to create the cronfile. Any existing file will be
#  overwritten.
: "${CRONFILE:?Variable not set or empty}"

#  ESTABLISHMENT_UPDATE_FROM_SIRENE (optional): The execution schedule for the establishment-backfill
#  pipeline in cron format. Default: daily at midnight.
: "${ESTABLISHMENT_UPDATE_FROM_SIRENE:=0 0 * * *}"

#  ESTABLISHMENT_SUGGEST_FORM_EDITION (optional): The execution schedule for the establishment-backfill
#  pipeline in cron format. Default: daily at midnight.
: "${ESTABLISHMENT_SUGGEST_FORM_EDITION:=0 0 * * *}"


#  EMAIL_WITH_ASSESSMENT_CREATION_LINK (optional): The execution schedule for the establishment-backfill
#  pipeline in cron format. Default: daily at midnight.
: "${EMAIL_WITH_ASSESSMENT_CREATION_LINK:=0 0 * * *}"

# Create logdir if it doesn't already exist.
if [[ ! -d $LOGDIR ]]; then
  mkdir -p $LOGDIR && chmod 755 $LOGDIR
fi

# Regenerate the cronfile. Any new pipeline schedules can be added here.
cat <<EOT > $CRONFILE
SHELL=/bin/bash
PATH=$PATH

# Pipeline: update-establishments-from-sirene
$ESTABLISHMENT_UPDATE_FROM_SIRENE cd /app/back && pnpm start-update-establishments-from-sirene >> $LOGDIR/update-establishments-from-sirene.log 2>&1

# Pipeline: trigger-suggest-edit-form-establishment-every-6-months
$ESTABLISHMENT_SUGGEST_FORM_EDITION cd /app/back && pnpm trigger-suggest-edit-form-establishment-every-6-months >> $LOGDIR/trigger-suggest-edit-form-establishment-every-6-months.log 2>&1

# Pipeline: trigger-sending-emails-with-assessment-creation-link
$EMAIL_WITH_ASSESSMENT_CREATION_LINK cd /app/back && pnpm trigger-sending-emails-with-assessment-creation-link >> $LOGDIR/trigger-sending-emails-with-assessment-creation-link.log 2>&1

EOT

# Register the cronfile with cron.
crontab $CRONFILE

echo "Cron configuration:"
crontab -l

echo "Starting cron in blocking mode"
cron -f
