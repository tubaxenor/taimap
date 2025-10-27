#!/bin/bash

# Script to update data from Google Sheets and regenerate YAML files

echo "正在下載最新資料..."

# Download data from Google Sheets
curl -L "https://docs.google.com/spreadsheets/d/15E0sastmidjk4CJlJJZoKZgbp5He5SKaUCbo4eMMlYY/export?format=csv&gid=418920722" -o data/data.csv

echo "正在處理資料..."

# Process the data
node process_data.js

echo "資料更新完成！"
echo "請提交變更到 GitHub："
echo "git add ."
echo "git commit -m 'Update data'"
echo "git push"