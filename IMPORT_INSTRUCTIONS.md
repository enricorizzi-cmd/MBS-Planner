# Importazione Dati Excel nel Database Supabase

Questo script importa direttamente i dati dal file Excel "MBS DATI IMPORT.xlsx" nel database Supabase.

## Prerequisiti

1. **File Excel**: Assicurati che il file `MBS DATI IMPORT.xlsx` sia nella directory principale del progetto
2. **Credenziali Supabase**: Hai bisogno delle credenziali del tuo progetto Supabase

## Configurazione

### 1. Ottieni le credenziali Supabase

1. Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **Settings** > **API**
4. Copia:
   - **Project URL** (per SUPABASE_URL)
   - **Service Role Key** (per SUPABASE_SERVICE_ROLE_KEY)

### 2. Configura le variabili d'ambiente

Crea un file `.env` nella directory principale del progetto:

```bash
# Copia il contenuto da env-example.txt
cp env-example.txt .env
```

Modifica il file `.env` con i tuoi valori reali:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**⚠️ ATTENZIONE**: La Service Role Key ha privilegi amministrativi. Non condividerla mai e non committarla nel repository!

## Esecuzione

### 1. Installa le dipendenze (se non già fatto)

```bash
npm install
```

### 2. Esegui lo script di importazione

```bash
node import-excel-to-db.cjs
```

## Struttura File Excel Supportata

Lo script riconosce automaticamente questi fogli:

- **Partners**: Lista dei partner
- **Aziende**: Aziende con indirizzo, telefono, email, partner
- **Clienti**: Studenti con email, telefono, partner  
- **Supervisori**: Supervisori con azienda e partner
- **Lista**: Foglio unificato con tutti i dati

### Colonne Richieste

#### Partners
- `Nome Partner` o `Partner` o `Nome`

#### Aziende
- `Nome Azienda` o `Azienda` o `Nome`
- `Indirizzo` (opzionale)
- `Telefono` (opzionale)
- `Email` (opzionale)
- `Partner` o `Nome Partner`

#### Studenti
- `Nome Studente` o `Studente` o `Nome`
- `Email`
- `Telefono` (opzionale)
- `Partner` o `Nome Partner`

#### Supervisori
- `Nome Supervisore` o `Supervisore` o `Nome`
- `Email`
- `Telefono` (opzionale)
- `Azienda` o `Nome Azienda`
- `Partner` o `Nome Partner`

#### Lista Unificata
- `Tipo` (Partner, Azienda, Studente, Supervisore)
- `Nome`
- `Email` (per Aziende, Studenti, Supervisori)
- `Telefono` (opzionale)
- `Indirizzo` (per Aziende)
- `Azienda` (per Supervisori)
- `Partner` o `Nome Partner`

## Output

Lo script mostrerà:

- ✅ Record creati con successo
- ⚠️ Avvisi per dati mancanti o non validi
- ❌ Errori durante l'importazione
- 📊 Riepilogo finale con statistiche

## Note Importanti

1. **Validazione**: Lo script valida automaticamente email e telefoni
2. **Duplicati**: I record esistenti vengono saltati (non sovrascritti)
3. **Dipendenze**: I partner devono esistere prima di creare aziende/studenti
4. **Dipendenze**: Le aziende devono esistere prima di creare supervisori
5. **Ordine**: Lo script processa i fogli nell'ordine: Partners → Aziende → Studenti → Supervisori → Lista

## Risoluzione Problemi

### Errore: "SUPABASE_URL non configurato"
- Verifica che il file `.env` esista e contenga SUPABASE_URL

### Errore: "SUPABASE_SERVICE_ROLE_KEY non configurato"
- Verifica che il file `.env` esista e contenga SUPABASE_SERVICE_ROLE_KEY

### Errore: "Partner non trovato"
- Assicurati che i partner siano definiti prima delle aziende/studenti
- Verifica che i nomi dei partner siano identici tra i fogli

### Errore: "Azienda non trovata"
- Assicurati che le aziende siano definite prima dei supervisori
- Verifica che i nomi delle aziende siano identici tra i fogli

## Supporto

Se riscontri problemi:

1. Controlla i log di output per messaggi di errore specifici
2. Verifica che il file Excel sia nella directory corretta
3. Assicurati che le credenziali Supabase siano corrette
4. Controlla che il database Supabase sia accessibile
