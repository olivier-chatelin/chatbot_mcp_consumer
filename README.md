# Code Assistant Chatbot

Application web React TypeScript avec interface Bootstrap pour un chatbot spécialisé dans les conseils de code et bonnes pratiques de développement, propulsé par OpenAI.

## 🚀 Fonctionnalités

- Interface chat moderne avec Bootstrap
- Conseils de code et bonnes pratiques (SOLID, sécurité, performance)
- Backend Express sécurisé avec proxy OpenAI API
- **Intégration MCP (Model Context Protocol)** : Accès aux outils externes via votre serveur MCP
- Streaming des réponses en temps réel
- Support Markdown avec coloration syntaxique
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

5. Configurer le chemin de votre serveur MCP dans `.env` :
   ```
   MCP_SERVER_PATH=C:\Users\chatelin\projets\POC_MCP
   ```

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
├── index.ts         # API endpoint /api/chat
│   ├── mcp-client.ts    # Client MCP (connexion stdio)
│   ├── openai-tools.ts  # Conversion outils MCP → OpenAI
│   └── system-prompts.ts
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
, react-markdown
- **Backend** : Express, OpenAI SDK, MCP SDK
- **Build** : Vite
- **Dev tools** : tsx, concurrently

## 🔌 Intégration MCP

Le chatbot se connecte automatiquement à votre serveur MCP local au démarrage. Les outils disponibles sur votre serveur MCP sont automatiquement exposés à OpenAI via function calling.

**Flow :**
1. Backend démarre et se connecte au serveur MCP (stdio)
2. Liste les outils disponibles
3. Les convertit en format OpenAI function calling
4. Quand OpenAI veut utiliser un outil, le backend l'exécute via MCP
5. Le résultat est renvoyé à OpenAI pour continuer la réponse

**Configuration dans `.env` :**
- `MCP_SERVER_COMMAND` : Commande pour lancer le serveur (défaut: `node`)
- `MCP_SERVER_PATH` : Chemin vers votre serveur MCPpt, Bootstrap 5, react-bootstrap
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
