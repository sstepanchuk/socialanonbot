#!/bin/bash

# Function to convert JSON string to env file string
json_to_env() {
    local json_string="$1"
    local env_string=""

    # Parse JSON string
    while IFS='=' read -r key value; do
        # Append to env string
        env_string+="$key=$value"$'\n'
    done <<< "$(jq -r 'to_entries[] | "\(.key)=\(.value)"' <<< "$json_string")"

    echo "$env_string"
}

# Retrieve JSON strings from inputs
JSONS="$1"

# Merge JSON strings using jq
MERGED_JSON=$(jq -n 'reduce inputs as $i ({}; . * $i)' <<< "$JSONS")

# Convert merged JSON to env file string
ENV_STRING=$(json_to_env "$MERGED_JSON")
echo "$ENV_STRING" | grep -Eo "^[^\=]+?"
# Output the resulting environment file string
echo "env=$ENV_STRING" >> $GITHUB_OUTPUT
