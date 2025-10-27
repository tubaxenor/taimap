#!/bin/bash

# Script to initialize Git repository and prepare for GitHub Pages deployment

echo "正在初始化 Git 儲存庫..."

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Taiwan map with 台派 locations"

echo "Git 儲存庫初始化完成！"
echo ""
echo "接下來的步驟："
echo "1. 在 GitHub 上建立新的儲存庫 (建議命名為 'taimap')"
echo "2. 將本地儲存庫連接到 GitHub："
echo "   git remote add origin https://github.com/tubaxenor/taimap.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. 在 GitHub 儲存庫設定中啟用 GitHub Pages："
echo "   - 前往 Settings > Pages"
echo "   - Source 選擇 'Deploy from a branch'"
echo "   - Branch 選擇 'main' 或 'master'"
echo "   - Folder 選擇 '/ (root)'"
echo ""
echo "4. 等待 GitHub Actions 完成部署"
echo "5. 您的網站將在 https://tubaxenor.github.io/taimap 上線"