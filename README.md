# File Management System

Smart file management app with a React + Vite frontend and an Express + MongoDB backend.

The app lets users authenticate, upload files, index file content, search inside documents, preview results, and manage stored files from a dashboard-style interface.

## Features

- User signup and login with JWT authentication
- File upload and metadata storage
- Full-text search across stored files
- PDF text extraction and OCR fallback for scanned content
- Support for documents, images, spreadsheets, and presentations
- Dashboard views for recent files, categories, quick actions, and activity
- File sharing flow and settings page

## Tech Stack

- Frontend: React, Vite, Material UI, Framer Motion, Recharts
- Backend: Node.js, Express, MongoDB, Mongoose, Multer, JWT
- Content processing: pdfjs-dist, Tesseract.js, pdf-parse, officeparser

## Project Structure

- frontend/ - Vite React app
- backend/ - Express API and database logic
- test_upload.js - upload test helper

## Getting Started

### Prerequisites

- Node.js 18 or newer
- MongoDB connection string

### Install

From the repository root:

1. Install dependencies for the root, frontend, and backend packages.
2. Create a backend .env file.

Example:

```bash
npm install
cd backend
npm install
cd ../frontend
npm install
```

### Environment Variables

Create backend/.env with values similar to:

```bash
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
CLIENT_URL=http://localhost:5173
```

### Run in Development

From the repository root:

```bash
npm run dev
```

This starts both apps together:

- Frontend on http://localhost:5173
- Backend on http://localhost:5000

You can also run them separately:

```bash
npm run frontend
npm run backend
```

## Build and Preview

From the frontend folder:

```bash
npm run build
npm run preview
```

## API Overview

- GET /api/health - backend health check
- POST /api/auth/signup - create account
- POST /api/auth/login - sign in
- GET /api/files - list files for the authenticated user
- GET /api/files/search - search files
- POST /api/files/upload - upload and index a file
- GET /api/files/:id - fetch a single file
- DELETE /api/files/:id - delete a file
- DELETE /api/files/all - delete all file metadata

## Notes

- File uploads are limited to 50 MB.
- The backend uses CORS for local development with the frontend running on port 5173.
- Search and preview behavior depends on file type and content extraction support.
