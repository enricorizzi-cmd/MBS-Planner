# 🚀 ISTRUZIONI DEPLOYMENT SERVIZIO UNICO - MBS PLANNER

## ✅ VERIFICA CONFIGURAZIONE REPOSITORY

Il tuo repository è **PERFETTAMENTE CONFIGURATO** per un servizio unico:

- ✅ **Backend** serve il frontend (righe 122-138 in `backend/src/index.ts`)
- ✅ **Dockerfile** multi-stage per build ottimizzato
- ✅ **Package.json** con script per installazione e build
- ✅ **Health checks** configurati (`/healthz` e `/readyz`)
- ✅ **CORS** configurato per il dominio Render
- ✅ **Static files** serviti dal backend Express

## 📋 ISTRUZIONI STEP-BY-STEP PER RENDER

### 1. **Vai su Render Dashboard**
- Accedi a [dashboard.render.com](https://dashboard.render.com)
- Clicca su **"New +"** → **"Web Service"**

### 2. **Configurazione Repository**
- **Connect Repository**: Seleziona `enricorizzi-cmd/MBS-Planner`
- **Branch**: `main` (dovrebbe essere già selezionato)
- **Root Directory**: Lascia vuoto (usa la root del repository)

### 3. **Configurazione Servizio**
- **Name**: `mbs-planner-unified` (o il nome che preferisci)
- **Region**: `Frankfurt (EU Central)` (hai già un servizio qui)
- **Runtime**: `Docker` (Render ha rilevato automaticamente il Dockerfile)

### 4. **Configurazione Build & Deploy**
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/healthz`

### 5. **Variabili d'Ambiente**
Aggiungi queste variabili d'ambiente:

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://mbs-planner-unified.onrender.com
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 6. **Deploy**
- Clicca su **"Create Web Service"**
- Render inizierà automaticamente il build e deploy

## 🔧 CONFIGURAZIONE SUPABASE

### 1. **Crea Progetto Supabase**
- Vai su [supabase.com](https://supabase.com)
- Crea un nuovo progetto
- Ottieni l'URL e le chiavi API

### 2. **Configura Database**
- Vai su **SQL Editor** in Supabase
- Esegui le migration dalla cartella `supabase/migrations/` in ordine:
  - `001_initial_schema.sql`
  - `002_rls_policies.sql`
  - `003_seed_data.sql`
  - `004_disposition_system.sql`
  - `005_disposition_rls.sql`
  - `006_manuals_seed_data.sql`
  - `007_student_companies_relationship.sql`
  - `008_student_companies_rls.sql`
  - `009_migrate_existing_data.sql`
  - `010_revenues_system.sql`
  - `011_revenues_rls.sql`
  - `012_revenues_seed_data.sql`

### 3. **Aggiorna Variabili d'Ambiente**
- Vai nel dashboard di Render
- Sezione **Environment** del tuo servizio
- Aggiorna le variabili Supabase con i valori reali

## 🎯 COSA SUCCEDE DOPO IL DEPLOY

1. **Frontend**: Servito su `https://mbs-planner-unified.onrender.com`
2. **API**: Disponibili su `https://mbs-planner-unified.onrender.com/api/*`
3. **Database**: Connesso via Supabase
4. **PWA**: Funziona completamente offline
5. **Health Checks**: Monitoraggio automatico

## 🔍 VERIFICA FUNZIONAMENTO

Dopo il deploy, testa:

- ✅ **Frontend**: `https://mbs-planner-unified.onrender.com`
- ✅ **Health Check**: `https://mbs-planner-unified.onrender.com/healthz`
- ✅ **API**: `https://mbs-planner-unified.onrender.com/api/auth`
- ✅ **Database**: Verifica connessione Supabase

## 🚨 TROUBLESHOOTING

### Se il build fallisce:
- Controlla i log in Render Dashboard
- Verifica che tutte le dipendenze siano installate
- Assicurati che il Dockerfile sia corretto

### Se il servizio non si avvia:
- Controlla le variabili d'ambiente
- Verifica che la porta sia 3000
- Controlla i log del servizio

### Se il frontend non carica:
- Verifica che il build del frontend sia completato
- Controlla che i file statici siano serviti correttamente
- Verifica le configurazioni CORS

## 📱 PWA CONFIGURATION

Il tuo progetto è già configurato come PWA:
- ✅ **Service Worker** automatico
- ✅ **Manifest** configurato
- ✅ **Offline support** abilitato
- ✅ **Push notifications** pronte

## 🎉 RISULTATO FINALE

Avrai un **servizio unico** che:
- Serve frontend React + backend Express
- Connesso a database Supabase
- PWA completamente funzionante
- Deploy automatico da GitHub
- Monitoraggio e health checks

**URL finale**: `https://mbs-planner-unified.onrender.com`
