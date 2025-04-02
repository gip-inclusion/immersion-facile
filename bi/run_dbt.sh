#!/bin/bash

# Check if we're in a virtual environment or in production
if [[ "$VIRTUAL_ENV" == "" && -d .venv ]]; then
  # Only activate venv if it exists and we're not in production
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
