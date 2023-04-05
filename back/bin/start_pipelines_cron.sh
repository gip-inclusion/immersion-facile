#!/usr/bin/env bash

# Initialization script for the pipelines docker container, to be run at container startup.

echo "Running $0 $@ (pwd: $(pwd))"

# The script uses the following environment variables:
#  LOGDIR (required): the directory in which to keep the log files.
: "${LOGDIR:?Variable not set or empty}"

#  CRONFILE (required): The path at which to create the cronfile. Any existing file will be
#  overwritten.
: "${CRONFILE:?Variable not set or empty}"

#  pipeline in cron format. Default: daily at 00:.
: "${ESTABLISHMENT_UPDATE_FROM_SIRENE:=14 0 * * *}"

#  pipeline in cron format. Default: daily at 00:08
: "${ESTABLISHMENT_SUGGEST_FORM_EDITION:=8 0 * * *}"

#  pipeline in cron format. Default: daily at 23:01
: "${CONVENTION_REMINDER:=01 23 * * *}"

#  pipeline in cron format. Default: daily at 23h53
: "${EMAIL_WITH_ASSESSMENT_CREATION_LINK:=53 23 * * *}"

#  pipeline in cron format. Default: daily at 01h12
: "${REFRESH_MATERIALIZED_VIEWS:=12 01 * * *}"

#  pipeline in cron format. Default: daily at 23h45
: "${MARK_ESTABLISHMENTS_AS_SEARCHABLE:=45 23 * * *}"

# Create logdir if it doesn't already exist.
if [[ ! -d $LOGDIR ]]; then
  mkdir -p $LOGDIR && chmod 755 $LOGDIR
fi

# Regenerate the cronfile. Any new pipeline schedules can be added here.
cat <<EOT > $CRONFILE
SHELL=/bin/bash
PATH=$PATH
NODE_ENV=production

# Pipeline: update-establishments-from-sirene
# $ESTABLISHMENT_UPDATE_FROM_SIRENE cd /app/back && pnpm start-update-establishments-from-sirene >> $LOGDIR/update-establishments-from-sirene.log 2>&1

# Pipeline: trigger-suggest-edit-form-establishment-every-6-months
$ESTABLISHMENT_SUGGEST_FORM_EDITION cd /app/back && pnpm trigger-suggest-edit-form-establishment-every-6-months >> $LOGDIR/trigger-suggest-edit-form-establishment-every-6-months.log 2>&1

# Pipeline: trigger-sending-emails-with-assessment-creation-link
$EMAIL_WITH_ASSESSMENT_CREATION_LINK cd /app/back && pnpm trigger-sending-emails-with-assessment-creation-link >> $LOGDIR/trigger-sending-emails-with-assessment-creation-link.log 2>&1

# Pipeline: trigger-refresh-materialized-views
$REFRESH_MATERIALIZED_VIEWS cd /app/back && pnpm trigger-refresh-materialized-views >> $LOGDIR/trigger-refresh-materialized-views.log 2>&1

# Pipeline: mark-establishments-as-searchable-when-max-contacts-allows
$MARK_ESTABLISHMENTS_AS_SEARCHABLE cd /app/back && pnpm mark-establishments-as-searchable-when-max-contacts-allows >> $LOGDIR/mark-establishments-as-searchable-when-max-contatcs-allows.log 2>&1

# Pipeline: convention-reminder
$CONVENTION_REMINDER cd /app/back && pnpm trigger-convention-reminder >> $LOGDIR/trigger-convention-reminder.log 2>&1

EOT

# Register the cronfile with cron.
crontab $CRONFILE

echo "Cron configuration:"
crontab -l

echo "Starting cron in blocking mode"
cron -f
