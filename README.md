<h1 align="center">
  ⚡ ElectroStock
</h1>

<p align="center">
  <strong>A modern, full-stack web application.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Backend-Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Container-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## 🏗️ Architecture

- **Frontend**: Vite + React/Vue (Located in `/frontend`)
- **Backend**: Node.js + Express API (Located in `/backend`)
- **Database**: MySQL 8.0

## 🚀 Deployment

This project is configured to be deployed on **Vercel** as a monorepo with multiple services. The `vercel.json` file handles routing to the correct service automatically.

---

## 🔐 Test Accounts / Login Credentials

> **⚠️ SECURITY WARNING:** These credentials are for local development and staging purposes only. Never use these in a production environment.

Use the following credentials to access different access levels within the application:

| Role | Email Address | Password |
| :--- | :--- | :--- |
| **👑 Admin** | `admin_test@example.com` | `password123` |
| **👤 Standard User** | `user_test@example.com` | `password123` |

---

## 💻 Installation

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [Docker](https://www.docker.com/) and Docker Compose *(Optional, but highly recommended)*

### Option 1: Using Docker Compose (Recommended)
The fastest way to get the entire stack (Frontend, Backend, and Database) running.

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd ElectroStock
   ```

2. **Environment Variables:**
   ```bash
   cp .env.example .env
   ```

3. **Start the application:**
   ```bash
   docker-compose up --build
   ```
   *This command spins up the MySQL database, Express backend, and Vite frontend.*

### Option 2: Manual Installation
If you prefer running services individually on your host machine:

1. **Clone the repository & set env variables:**
   ```bash
   git clone <your-repository-url>
   cd ElectroStock
   cp .env.example .env
   ```

2. **Database Setup:**
   Ensure your local MySQL server is running and create a database named `electrostock`.

3. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```

4. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```

---

## 🕹️ Usage

### Running Locally (Manual Setup)
*(Skip this if you are using Docker)*

Start these in separate terminal tabs/windows:

**Backend Server:**
```bash
cd backend
npm run dev
```

**Frontend Application:**
```bash
cd frontend
npm run dev
```

### Accessing the Application
- 🌐 **Frontend App:** Open [http://localhost:8080](http://localhost:8080) (if using Docker) or the URL provided by Vite (usually [http://localhost:5173](http://localhost:5173)).
- 🔌 **Backend API:** The API is accessible at `http://localhost:5000`.

Once the app is running, use the **Admin** or **Standard User** credentials provided in the Test Accounts section to log in and explore the application!
