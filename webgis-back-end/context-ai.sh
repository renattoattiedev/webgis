#!/bin/bash
echo "" > context-ai-webgis-backend.txt
find ./src -type f -name "*.ts" | while read file; do
echo -n "// Path: $file " >> context-ai-webgis-backend.txt
echo -n "// Classes: " >> context-ai-webgis-backend.txt
grep -E "^(export )?(class|interface)" "$file" | sed 's/^/\/\/ /' | tr '\n' ' ' >> context-ai-webgis-backend.txt
echo -n "// Content: " >> context-ai-webgis-backend.txt
# Compacta o conteúdo removendo quebras de linha e espaços extras
cat "$file" | tr -d '\n' | tr -s ' ' | sed 's/\/\*.*\*\///g' | sed 's/\/\/.*//g' >> context-ai-webgis-backend.txt
echo -n " " >> context-ai-webgis-backend.txt
done