# ElectroStock

A web application with a Vite frontend and an Express Node.js backend.

## Architecture
- **Frontend**: Vite + React/Vue (in `/frontend`)
- **Backend**: Node.js + Express (in `/backend`)

## Deployment
This project is configured to be deployed on Vercel as a monorepo with multiple services. The `vercel.json` file handles routing to the correct service.

## Test Accounts / Roles

> **⚠️ SECURITY WARNING:** Never store real, live, or production credentials in this README or anywhere in your version control (GitHub). 

If you have a database seeder script for testing purposes, you can document the local test accounts here. Replace the examples below with the fake test credentials your system generates:

- **Admin Role:**
  - Email: `admin_test@example.com`
  - Password: `password123`

- **Standard User Role:**
  - Email: `user_test@example.com`
  - Password: `password123`

*(Please ensure these are only used for local or staging environments, not production).*
