#!/bin/bash

# Activate virtual environment if not already activated
if [[ "$VIRTUAL_ENV" == "" ]]; then
  source .venv/bin/activate
fi

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  set -a  # automatically export all variables
  source .env
  set +a
else
  echo "Warning: .env file not found. Using default environment variables."
fi

# Run dbt command with local profiles directory
dbt "$@" --profiles-dir=.

# Example usage:
# ./run_dbt.sh run
# ./run_dbt.sh debug
# ./run_dbt.sh test 
