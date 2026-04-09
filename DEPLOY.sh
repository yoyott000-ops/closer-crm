#!/bin/bash
# ╔══════════════════════════════════════════════════════╗
# ║         CLOSER CRM — Script de déploiement          ║
# ║         Lance ce fichier dans le Terminal           ║
# ╚══════════════════════════════════════════════════════╝

echo ""
echo "⚡ Closer CRM — Installation & Déploiement"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifie Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js non installé. Lance d'abord:"
  echo "   brew install node"
  exit 1
fi

echo "✅ Node.js $(node -v) détecté"
echo ""
echo "📦 Installation des dépendances..."
npm install

echo ""
echo "🔧 Installation de Vercel CLI..."
npm install -g vercel

echo ""
echo "🚀 Déploiement sur Vercel..."
echo "   → Crée un compte gratuit sur vercel.com si demandé"
echo "   → Appuie sur ENTRÉE à chaque question"
echo ""
vercel --prod

echo ""
echo "✅ C'est en ligne ! Ton URL est affichée ci-dessus."
echo "   Bookmarke-la dans Chrome pour y accéder partout."
