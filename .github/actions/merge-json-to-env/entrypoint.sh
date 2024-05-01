#!/bin/sh

# Function to convert JSON string to env file string
json_to_env() {
    local json_string=$1
    local env_string=""

    # Parse JSON string
    while IFS= read -r line; do
        key=$(echo "$line" | jq -r 'keys | .[]')
        value=$(echo "$line" | jq -r ".$key")

        # Append to env string
        env_string+="$key=$value"$'\n'
    done <<< "$(echo "$json_string" | jq -c '.[]')"

    echo "$env_string"
}

# Retrieve JSON strings from inputs
JSONS="$1"

# Merge JSON strings using jq
MERGED_JSON=$(jq -n 'reduce inputs as $i ({}; . * $i)' <(printf "%s\n" "${JSONS[@]}"))

# Convert merged JSON to env file string
ENV_STRING=$(json_to_env "$MERGED_JSON")

# Output the resulting environment file string
echo "$ENV_STRING"
