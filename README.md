# MBS Planner

MBS Planner è una Web App PWA moderna per la gestione di studenti e programmazione, sviluppata con React, TypeScript, Supabase e deploy su Render.

## 🚀 Caratteristiche

- **PWA Completa**: Installabile, offline-first, notifiche push
- **UI/UX Gaming**: Design moderno con palette neon e micro-animazioni
- **Multi-tenant**: Gestione multi-azienda con RLS (Row Level Security)
- **4 Livelli Utente**: Admin, Project Manager, Amministrazione, Titolare
- **Responsive**: Ottimizzata per desktop e mobile
- **Sicurezza**: Autenticazione Supabase, validazione Zod, rate limiting
- **Performance**: Lighthouse ≥ 90, code-splitting, lazy loading
- **Sistema Disposizione**: Generazione automatica disposizioni classi MBS
- **Algoritmo Intelligente**: Anti-affiancamento aziende, fasce di avanzamento
- **Editing Live**: Drag&drop, modifiche in tempo reale, lock posti
- **Stampa A3**: Output professionale con legenda e conteggi

## 🏗️ Architettura

### Stack Tecnologico

- **Frontend**: React 18 + Vite + TypeScript
- **UI**: Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: Express + TypeScript + Zod
- **Database**: Supabase PostgreSQL con RLS
- **Deploy**: Render (Frontend + Backend)
- **CI/CD**: GitHub Actions
- **PWA**: Vite PWA Plugin + Web Push

### Struttura Repository

```
mbs-planner/
├── app/                    # Frontend React
│   ├── src/
│   │   ├── components/     # Componenti UI
│   │   ├── pages/         # Pagine dell'app
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities e configurazioni
│   │   └── styles/        # Stili globali
│   ├── public/            # Asset statici e PWA
│   └── package.json
├── backend/               # API Express
│   ├── src/
│   │   ├── routes/        # Route API
│   │   ├── middleware/    # Middleware
│   │   ├── schemas/       # Validazione Zod
│   │   └── index.ts       # Entry point
│   └── package.json
├── supabase/              # Database e migrazioni
│   ├── migrations/        # Migrazioni SQL
│   └── config.toml        # Configurazione Supabase
└── .github/               # GitHub Actions
```

## 🚀 Setup e Installazione

### Prerequisiti

- Node.js 20 LTS
- npm o yarn
- Account Supabase
- Account Render (per deploy)

### 1. Clone del Repository

```bash
git clone https://github.com/your-username/mbs-planner.git
cd mbs-planner
```

### 2. Installazione Dipendenze

```bash
npm install
```

### 3. Configurazione Supabase

1. Crea un nuovo progetto su [Supabase](https://supabase.com)
2. Esegui le migrazioni:

```bash
# Installa Supabase CLI
npm install -g supabase

# Link al progetto
supabase link --project-ref YOUR_PROJECT_REF

# Esegui migrazioni
supabase db push
```

### 4. Variabili d'Ambiente

Crea i file `.env` per frontend e backend:

**app/.env.local:**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**backend/.env:**
```env
NODE_ENV=development
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CORS_ORIGIN=http://localhost:3000
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@mbsplanner.com
SENTRY_DSN=your_sentry_dsn
```

### 5. Generazione Chiavi VAPID

Per le notifiche push:

```bash
npx web-push generate-vapid-keys
```

### 6. Avvio in Sviluppo

```bash
# Avvia frontend e backend
npm run dev

# Solo frontend
npm run dev:frontend

# Solo backend
npm run dev:backend
```

L'app sarà disponibile su:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 📱 PWA e Notifiche

### Installazione App

L'app è installabile come PWA:
- **Desktop**: Icona "Installa" nel browser
- **Mobile**: "Aggiungi alla schermata Home"

### Notifiche Push

- **Desktop**: Supportate su tutti i browser moderni
- **Mobile**: Supportate su Android e iOS 16.4+
- **iOS**: Richiede aggiunta alla schermata Home

### Offline

L'app funziona offline con:
- Cache dei dati essenziali
- Pagina offline personalizzata
- Sincronizzazione al ripristino connessione

## 🎯 Sistema Disposizione Classi MBS

### Caratteristiche Principali

- **Generazione Automatica**: Algoritmo intelligente per disposizione ottimale
- **Anti-affiancamento**: Mai due studenti della stessa azienda adiacenti
- **Fasce di Avanzamento**: Posizionamento basato sul progresso nel manuale
- **Riserve Automatiche**: Posti riservati per studenti quasi al termine
- **Editing Live**: Drag&drop, modifiche in tempo reale, lock posti
- **Stampa A3**: Output professionale con legenda e conteggi

### Algoritmo di Disposizione

1. **Calcolo Layout**: Determina geometria sala (3/4 posti per blocco, 8-12 righe)
2. **Raggruppamento**: Organizza studenti per area (A/B/C) e manuale
3. **Fasce di Avanzamento**: Ordina per progresso (più avanzati davanti)
4. **Anti-affiancamento**: Distribuisce aziende per evitare vicinanza
5. **Riserve**: Crea posti riservati per transizioni tra manuali
6. **Validazione**: Verifica regole e suggerisce ottimizzazioni

### Aree Tematiche

- **Area A**: Vendite, Marketing, Etica, DV, Comunicazione Pratica
- **Area B**: Comunicazione Teoria, Potenziale, Principi, Basi, Marketing, Ruolo Amm., Open Day
- **Area C**: Leadership, Spunti, Management, EdilMasterclass, Resp. Intermedio

### Funzionalità Avanzate

- **Mantieni Posto**: Continuità tra D1 e D2 per stessa area
- **Tag Speciali**: Open Day, Coach, Ritardo con priorità specifiche
- **Supervisori**: Assegnazione per riga con abilitazioni per area
- **Storico**: Cronologia completa delle modifiche con log utente
- **Export**: PDF, CSV per logistica e backup

## 🔐 Sistema di Autenticazione

### Livelli Utente

1. **Admin**: Accesso completo a tutte le aziende
2. **Project Manager**: Gestione completa della propria azienda
3. **Amministrazione**: Gestione completa della propria azienda
4. **Titolare**: Gestione completa della propria azienda

### RLS (Row Level Security)

Tutte le tabelle hanno RLS attivo:
- Utenti vedono solo i dati della propria azienda
- Admin può vedere tutti i dati
- Policy granulari per ogni operazione

## 🚀 Deploy su Render

### 1. Configurazione Render

1. Crea un nuovo servizio su [Render](https://render.com)
2. Connetti il repository GitHub
3. Configura le variabili d'ambiente

### 2. Variabili d'Ambiente Render

**Backend:**
```
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CORS_ORIGIN=https://your-app.onrender.com
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@mbsplanner.com
```

**Frontend:**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Deploy Automatico

Il deploy avviene automaticamente ad ogni push su `main` tramite GitHub Actions.

## 🧪 Testing

```bash
# Test frontend
npm run test:frontend

# Test backend
npm run test:backend

# Test completo
npm run test

# Coverage
npm run test:coverage
```

## 📊 Performance

### Lighthouse Score

Target: ≥ 90 su tutte le metriche
- Performance
- Best Practices
- Accessibility
- SEO

### Ottimizzazioni

- Code splitting automatico
- Lazy loading delle route
- Immagini WebP/AVIF
- Service Worker caching
- Compressione gzip/brotli

## 🔧 Script Disponibili

```bash
# Sviluppo
npm run dev              # Avvia frontend + backend
npm run dev:frontend     # Solo frontend
npm run dev:backend      # Solo backend

# Build
npm run build            # Build completo
npm run build:frontend   # Solo frontend
npm run build:backend    # Solo backend

# Testing
npm run test             # Test completo
npm run test:frontend    # Test frontend
npm run test:backend     # Test backend

# Linting
npm run lint             # Lint completo
npm run lint:frontend    # Lint frontend
npm run lint:backend     # Lint backend

# Formattazione
npm run format           # Formatta tutto il codice
```

## 📚 Documentazione API

### Endpoints Principali

- `GET /healthz` - Health check
- `GET /readyz` - Readiness check
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Profilo utente corrente

### Autenticazione

Tutti gli endpoint (eccetto login) richiedono header:
```
Authorization: Bearer <jwt_token>
```

## 🐛 Troubleshooting

### Problemi Comuni

1. **Errori CORS**: Verifica `CORS_ORIGIN` nel backend
2. **RLS Errors**: Controlla le policy Supabase
3. **PWA non installabile**: Verifica manifest e service worker
4. **Notifiche non funzionano**: Controlla chiavi VAPID

### Log e Debug

```bash
# Log backend
npm run dev:backend

# Log frontend
npm run dev:frontend

# Log Supabase
supabase logs
```

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch feature (`git checkout -b feature/amazing-feature`)
3. Commit delle modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

### Convenzioni

- **Branch**: `feature/`, `fix/`, `docs/`
- **Commit**: Conventional Commits
- **PR**: Descrizione dettagliata e test

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per dettagli.

## 📞 Supporto

Per supporto e domande:
- Email: admin@mbsplanner.com
- Issues: [GitHub Issues](https://github.com/your-username/mbs-planner/issues)

## 🙏 Ringraziamenti

- [Supabase](https://supabase.com) per l'infrastruttura
- [Render](https://render.com) per l'hosting
- [shadcn/ui](https://ui.shadcn.com) per i componenti UI
- [Framer Motion](https://www.framer.com/motion/) per le animazioni

---

**MBS Planner v1.0.0** - Sviluppato con ❤️ da Enrico Rizzi
