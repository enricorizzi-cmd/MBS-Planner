# MBS Planner - Deployment Guide

## Servizi Creati

### 1. Database PostgreSQL
- **Nome**: mbs-planner-db
- **ID**: dpg-d3963emmcj7s738pjvjg-a
- **URL**: https://dashboard.render.com/d/dpg-d3963emmcj7s738pjvjg-a
- **Stato**: ✅ Disponibile
- **Piano**: Gratuito
- **Scadenza**: 23 ottobre 2025

### 2. Frontend Static Site
- **Nome**: mbs-planner-frontend
- **ID**: srv-d3963m95pdvs7391n6o0
- **URL**: https://mbs-planner-frontend.onrender.com
- **URL Dashboard**: https://dashboard.render.com/static/srv-d3963m95pdvs7391n6o0
- **Stato**: ✅ Attivo
- **Piano**: Gratuito

## Configurazione Variabili d'Ambiente

### Per il Frontend (Static Site)
Configura queste variabili nel dashboard di Render:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_NAME=MBS Planner
VITE_APP_VERSION=1.0.0
VITE_APP_URL=https://mbs-planner-frontend.onrender.com
```

### Per il Database
Il database è già configurato e disponibile. Le credenziali sono:
- **Host**: dpg-d3963emmcj7s738pjvjg-a.oregon-postgres.render.com
- **Database**: mbs_planner_db
- **User**: mbs_planner_db_user
- **Password**: [da configurare nel dashboard]

## Prossimi Passi

1. **Configurare Supabase**:
   - Crea un progetto su Supabase
   - Configura le tabelle usando le migration in `supabase/migrations/`
   - Ottieni l'URL e le chiavi API

2. **Aggiornare le Variabili d'Ambiente**:
   - Vai al dashboard del servizio frontend
   - Aggiungi le variabili d'ambiente necessarie
   - Riavvia il servizio

3. **Testare il Deployment**:
   - Verifica che il frontend sia accessibile
   - Testa la connessione al database
   - Verifica le funzionalità principali

## Note Importanti

- Il servizio frontend è già configurato per il deployment automatico
- Il database è disponibile e pronto per l'uso
- Per un servizio web unico (frontend + backend), Render richiede una carta di credito
- L'architettura attuale usa Supabase per il backend, quindi non è necessario un servizio web separato

## URL del Progetto

- **Frontend**: https://mbs-planner-frontend.onrender.com
- **Database Dashboard**: https://dashboard.render.com/d/dpg-d3963emmcj7s738pjvjg-a
- **Frontend Dashboard**: https://dashboard.render.com/static/srv-d3963m95pdvs7391n6o0
