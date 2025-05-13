#!/bin/bash

# Function to process a file
process_file() {
  local file=$1
  # Skip queryClient.ts since we already updated it
  if [[ $file == *"queryClient.ts"* ]]; then
    return
  fi
  
  echo "Processing $file"
  # Replace apiRequest('/path', 'METHOD', data) with apiRequest('METHOD', '/path', data)
  # and apiRequest('/path', 'METHOD') with apiRequest('METHOD', '/path')
  sed -i -E "s/apiRequest\((['\"]\/[^'\"]+['\"])[[:space:]]*,[[:space:]]*(['\"](POST|GET|PATCH|DELETE|PUT)['\"])/apiRequest(\2, \1/g" "$file"
}

# Find all TS/TSX files with apiRequest and process them
grep -r "apiRequest(" --include="*.tsx" --include="*.ts" client/src | cut -d: -f1 | sort | uniq | while read -r file; do
  process_file "$file"
done

echo "All files processed!"
