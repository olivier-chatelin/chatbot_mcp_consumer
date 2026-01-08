# Code Assistant Chatbot

Application web React TypeScript avec interface Bootstrap pour un chatbot spécialisé dans les conseils de code et bonnes pratiques de développement, propulsé par OpenAI.

## 🚀 Fonctionnalités

- Interface chat moderne avec Bootstrap
- Conseils de code et bonnes pratiques (SOLID, sécurité, performance)
- Backend Express sécurisé avec proxy OpenAI API
- Historique de conversation
- TypeScript strict sur frontend et backend

## 📋 Prérequis

- Node.js 18+
- Clé API OpenAI

## ⚙️ Installation

1. Cloner le projet
2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Configurer les variables d'environnement :
   ```bash
   # Copier le template (déjà fait)
   # Éditer .env et ajouter votre clé OpenAI
   ```

4. Dans le fichier `.env`, remplacer `your_openai_api_key_here` par votre vraie clé API OpenAI

## 🏃 Utilisation

### Mode développement

Lance le frontend (Vite) et le backend (Express) en parallèle :

```bash
npm run dev
```

- Frontend : http://localhost:5173
- Backend API : http://localhost:3001

### Build production

```bash
npm run build
```

### Scripts disponibles

- `npm run dev` - Lance frontend et backend en mode développement
- `npm run dev:client` - Lance uniquement le frontend Vite
- `npm run dev:server` - Lance uniquement le backend Express
- `npm run build` - Build production (client + server)
- `npm run preview` - Prévisualise le build client

## 📁 Structure du projet

```
├── server/              # Backend Express
│   └── index.ts         # API endpoint /api/chat
├── src/
│   ├── components/      # Composants React
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── InputArea.tsx
│   │   └── Message.tsx
│   ├── hooks/           # Hooks personnalisés
│   │   └── useChat.ts
│   ├── services/        # Services API
│   │   └── chatService.ts
│   ├── config/          # Configuration
│   │   └── system-prompts.ts
│   ├── types/           # Types TypeScript
│   │   └── chat.types.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 🔒 Sécurité

- La clé API OpenAI est stockée côté backend uniquement
- Jamais exposée dans le code frontend
- Requêtes proxifiées via Express

## 🛠️ Technologies

- **Frontend** : React 19, TypeScript, Bootstrap 5, react-bootstrap
- **Backend** : Express, OpenAI SDK
- **Build** : Vite
- **Dev tools** : tsx, concurrently

## 📝 Configuration OpenAI

Variables d'environnement dans `.env` :

- `OPENAI_API_KEY` : Votre clé API (obligatoire)
- `OPENAI_MODEL` : Modèle à utiliser (défaut: gpt-4)
- `OPENAI_TEMPERATURE` : Créativité (0-2, défaut: 0.7)
- `OPENAI_MAX_TOKENS` : Tokens max par réponse (défaut: 2000)
- `PORT` : Port du serveur backend (défaut: 3001)
