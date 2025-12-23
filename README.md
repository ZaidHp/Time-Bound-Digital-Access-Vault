# Time-Bound Digital Access Vault

A full-stack web application designed to securely store sensitive content and share it using temporary, rule-based access links. [cite_start]This project is implemented as an assessment for the Institutes of Technical & Vocational Education (ITVE)[cite: 275, 287].

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Assumptions & Design Decisions](#assumptions--design-decisions)
- [Security Considerations](#security-considerations)

## Project Overview
This system allows authenticated users to create "vaults" of sensitive text and generate unique share links with specific constraints:
- **Expiration Time:** Links become invalid after a set date/time.
- **View Limits:** Links expire after a maximum number of views.
- **Password Protection:** Optional PIN/password for added security.
- **Audit Logging:** Every access attempt (successful or denied) is logged.

## Architecture
The application follows a decoupled client-server architecture where the **Backend is the single source of truth**.

1.  **Frontend (Next.js):** Handles the UI, user state, and displays the vault content. It communicates with the backend via RESTful APIs.
2.  **Backend (FastAPI):** Manages authentication, database interactions, and enforces strict access rules.
3.  **Database (PostgreSQL):** Persists users, vault items, active share links, and audit logs.

### Database Schema
The relational model consists of four main entities:
* **User:** Stores credentials (hashed) for authentication.
* **VaultItem:** Stores the sensitive content and owner reference.
* **ShareLink:** Stores access rules (max views, expiry, password hash) and the unique token.
* **AccessLog:** An immutable record of every access attempt, including IP and outcome.

## Tech Stack

### Backend
* **Framework:** FastAPI (Python) - Chosen for high performance and automatic validation.
* **Database ORM:** SQLAlchemy (AsyncIO) with `asyncpg`.
* **Authentication:** JWT (JSON Web Tokens) with `python-jose`.
* **Security:** `passlib` with Bcrypt for password hashing.

### Frontend
* **Framework:** Next.js 16 (React 19).
* **Styling:** Tailwind CSS.
* **HTTP Client:** Axios.
* **Icons:** Lucide React.

## Setup & Installation

### Prerequisites
* Node.js (v18+)
* Python (v3.10+)
* PostgreSQL Database (Local or Cloud/Neon)

### 1. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows:
    venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Create a `.env` file in the `backend/` root with your database credentials:
    ```env
    DATABASE_URL=postgresql+asyncpg://user:password@host/dbname
    SECRET_KEY=your_super_secret_key
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    FRONTEND_URL=http://localhost:3000
    ```
5.  Start the server:
    ```bash
    uvicorn main:app --reload
    ```
    The API will run at `http://127.0.0.1:8000`.

### 2. Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env.local` file (optional if defaults are used, but recommended):
    ```env
    NEXT_PUBLIC_API_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
    The app will run at `http://localhost:3000`.

## Assumptions & Design Decisions

1.  **Race Condition Handling:**
    * *Assumption:* Simultaneous access attempts could exceed the view limit.
    * [cite_start]*Solution:* The backend uses atomic database updates (or explicit locking strategies) to decrement the `current_views` count, ensuring strict enforcement of limits even under load[cite: 348].

2.  **Security Over UX:**
    * *Decision:* Access logs are immutable. Even if a link is deleted, the history of who accessed it (and when) remains for audit purposes.
    * [cite_start]*Decision:* Generic error messages are used during login and link access to prevent user enumeration or brute-force guessing[cite: 353].

3.  **Token Generation:**
    * Secure, URL-safe random tokens are generated for share links to prevent guessing.

4.  **Timezones:**
    * All timestamps (`created_at`, `expires_at`, `access_time`) are stored as timezone-aware UTC datetime objects to ensure consistency across different user locations.

## Security Considerations

* **No Sensitive Data in URL:** The share link uses a random token, not the database ID, to prevents ID enumeration attacks.
* **Server-Side Validation:** All checks (expiry, view count, password) happen on the server. The frontend is merely a view layer and cannot bypass these checks.
* **Password Hashing:** Passwords for both user accounts and protected links are never stored in plain text.
* **CORS Policy:** The backend strictly restricts CORS to the defined `FRONTEND_URL` to prevent unauthorized cross-origin requests.

---
