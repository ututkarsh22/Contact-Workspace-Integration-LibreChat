# Contact Workspace Integration — LibreChat

## Overview

This is my implementation of the Contacts feature for LibreChat. The idea was simple — let users store contacts and ask the AI about them in normal chat. No special commands, no switching screens. Just ask "who works at Stripe?" and get an answer based on your actual data.

I spent most of my time on the AI integration part — how do you make an LLM aware of your database without sending everything every time?

---

## What I Built

### 1. Contact Model
Standard fields — name, company, role, email, notes, created_at. For arbitrary attributes I used MongoDB's Map type which accepts any key-value pair without schema changes. So CSV columns like `industry`, `location`, `funding_stage` just go into `metadata` automatically.

I also added `metadataText` — a flat string of all metadata joined together, purely for search performance. Searching Map values directly in MongoDB is slow, so I pre-compute a searchable string when the contact is saved.

### 2. CSV Import
Bulk import using multer for file upload and csv-parser for parsing. Uses `insertMany` for a single DB operation instead of inserting one by one. Since `insertMany` skips Mongoose middleware, I generate `metadataText` manually inside the CSV parsing loop.

### 3. Contacts UI
Sidebar panel in the LibreChat nav. Features:
- View all contacts
- Click any contact to see full details including arbitrary attributes
- **Edit contact** — update any field including metadata directly from the panel
- **Delete contact** — remove a contact with confirmation
- Add new contacts manually with extra key-value fields
- Import from CSV

### 4. AI Integration

I used **RAG (Retrieval-Augmented Generation)** — searching relevant contacts and injecting them into the AI context before the query is sent.

**Flow:**
```
User sends message
      ↓
isContactQuery() — checks for people-related signal words
      ↓
If yes → extractKeywords() → search MongoDB
      ↓
Format matching contacts as plain text
      ↓
Inject into AI context (invisible to user)
      ↓
AI answers using real contact data
```

**Injection Logic:**
I inject contact context in two ways depending on how the client is configured:

```js
if (client && client.options && client.options.agent) {
  // agent mode — inject into additional_instructions
  agent.additional_instructions = (agent.additional_instructions || '') + contactContext;
} else {
  // standard mode — inject into systemMessage
  messageOptions.systemMessage = (messageOptions.systemMessage || '') + contactContext;
}
```

This handles both agent-based and standard chat modes in LibreChat correctly.

Only relevant contacts are sent — a query about "Stripe" only gets Stripe contacts, not everyone.

---

## Project Structure

```
api/
  models/
    Contact.model.js          ← MongoDB schema with metadata Map
  server/
    routes/
      contacts.js             ← GET, POST, PUT, DELETE, import endpoints
    controllers/
      contact.controller.js   ← controller logic
    services/
      contactSearch.js        ← keyword extraction, DB search, prompt formatting
    controllers/agents/
      request.js              ← inject contacts before AI call

client/
  src/
    components/Nav/
      ContactsPanel.jsx       ← sidebar UI with view, edit, delete, add, import
    hooks/
      useContacts.js          ← fetch, add, update, delete, import contacts
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB running locally
- Google AI Studio API key

### Steps

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd FolderName of cloned one

# 2. Install dependencies
npm ci

# 3. Set up environment
cp .env.example .env


```

Edit `.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/LibreChat
GOOGLE_KEY=your_google_api_key_here
GEMINI_API_KEY=same_key_as_above
DOMAIN_CLIENT=http://localhost:3091
DOMAIN_SERVER=http://localhost:3080
```

```bash
# 4. Run backend
npm run backend

# 5. Run frontend (separate terminal)
npm run frontend
```

Open `http://localhost:3091`

```
for development local machine you can also run
npm run frontend:dev
npm run backend:dev

(both on seperate)
```

### Importing Contacts

The provided CSV download links returned a billing error (`UserProjectAccountProblem — billing account disabled`). I tested with manually created CSV files following the same schema. The import handles any CSV — extra columns automatically become metadata.

Expected format:
```
name,company,role,email,notes,industry,location,...
John Doe,Acme Corp,CTO,john@acme.com,Notes here,AI,San Francisco,...
```

---

## Design Questions

### 1. If the system needed to support 1,000,000 contacts, how would you redesign it?

To support a much larger dataset, I would redesign the retrieval layer to reduce database scans and improve query performance.

Some improvements I would make:

- Add indexes on frequently searched fields such as:
  - name
  - company
  - role
  - email

- Improve query filtering so only relevant contacts are retrieved before sending data to the LLM.

- Cache frequently repeated searches using Redis to reduce repeated database queries.

- Limit the number of contacts injected into the prompt to reduce token usage and improve LLM response quality.

My current implementation works well for small-to-medium datasets, but for 1 million contacts, optimized search and indexing would become essential.

### 2. How would you ensure the assistant retrieves the most relevant contacts for a query?

Current keyword matching works for direct queries but misses semantic ones. Better approach would be vector similarity search, or hybrid search combining keyword and vector scores. Another option is function calling, give the AI a search tool so it forms its own query rather than relying on my keyword extraction.

### 3. What are the limitations of your current implementation?

- **Keyword matching is basic** — won't catch synonyms or typos
- **isContactQuery can have false positives** — "who invented the telephone" triggers a DB search
- **No pagination** — fine for small datasets, would be slow with thousands of contacts
- **metadataText can get stale** — direct DB updates won't auto-update the search field
- **Token limit risk** — injecting 20 detailed contacts per query adds significant text to each AI request

---

## Architecture Summary

The AI integration is a single hook in `ResumableAgentController`. All search and formatting logic is isolated in `contactSearch.js` so the retrieval strategy can be swapped later without touching the controller.
I taken help of AI to make my readme file.
