# WorkWise - Job Search & Application Portal

WorkWise is a modern, responsive job search and application portal built as a decoupled Full-Stack Web Application. It consists of a React Single-Page Application (SPA) frontend powered by Vite and Tailwind CSS, and a Node.js Express backend API connected to MongoDB Atlas.

---

## 🚀 Key Features

*   **User Authentication**: Secure register and login systems using session-based authentication (`express-session`) and bcrypt password hashing.
*   **Role Management & User Profiles**: User profiles supporting customized education, experience, and skill lists for Job Seekers and Employers.
*   **Job & Company Directory**: Browse, search, and filter companies based on industry or name using MongoDB text searches.
*   **Application Cart**: Add companies you are interested in to a "Job Cart" to track applications and upload your resume.
*   **Resume Upload System**: Built-in resume submission utilizing `multer` on the Express API server to store applicant files securely.
*   **Contact Form**: Contact/feedback system communicating directly with database models.
*   **Production Serving**: The Express server is capable of serving compiled production-ready React client assets as a unified host.

---

## 🛠️ Tech Stack

### Frontend
*   **Library**: React (v19)
*   **Routing**: React Router DOM (v7)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS (v4) with `@tailwindcss/vite`
*   **Icons**: React Icons
*   **Linting**: Oxlint

### Backend
*   **Environment**: Node.js & Express
*   **Database**: MongoDB Atlas via Mongoose
*   **Authentication**: Session-based (`express-session`), `bcryptjs`
*   **File Uploads**: Multer
*   **CORS**: Configured for local development (`http://localhost:5173`)

---

## 📁 Project Structure

```text
workwise-ejs/
├── Backend/                    # Express Backend API Server
│   ├── config/                 # Mongoose Database setup
│   ├── controllers/            # Request handlers for routes
│   ├── models/                 # Mongoose Schemas (User, Company, Application)
│   ├── routes/                 # API endpoint definitions
│   ├── importCompanies.js      # Utility script to import companies from JSON
│   ├── seedCompanies.js        # Utility script to inspect MongoDB data
│   ├── server.js               # Entry point of the Express Backend
│   └── package.json            # Backend dependencies
│
├── frontend/                   # React Frontend Client (Vite)
│   ├── src/
│   │   ├── components/         # Common UI Components (Navbar, Footer, ProtectedRoute)
│   │   ├── context/            # AuthProvider Context
│   │   ├── pages/              # Views (Home, Login, Signup, Companies, Cart, Apply, Contact)
│   │   ├── App.jsx             # Main router configurations
│   │   └── main.jsx            # Application mount point
│   ├── package.json            # Frontend dependencies
│   └── vite.config.js          # Vite and Tailwind config
│
├── functions/                  # Netlify/Serverless legacy functions configuration
│   ├── package.json
│   └── server.js
│
├── uploads/                    # Directory where resumes/uploaded files are stored
├── vercel.json                 # Deployment configuration for Vercel
└── README.md                   # Project documentation
```

---

## 🗃️ Data Models

### Users
Stores account and resume builder data.
*   `username` (String, unique, required)
*   `email` (String, unique, required)
*   `password` (String, hashed using bcrypt)
*   `role` (String, enum: `['jobseeker', 'employer']`, default: `'jobseeker'`)
*   `profile` (Nested object with `fullName`, `phone`, `address`, `skills[]`, `experience[]`, `education[]`)

### Companies
Stores company directory details.
*   `companyId` (String, unique, required)
*   `name` (String, required)
*   `industry` (String, required)
*   `headquarters` (String, required)
*   `description` (String, required)

### Applications (Job Cart)
Stores specific job applications/saved opportunities and resume references.
*   `userId` (ObjectId referencing `User`, required)
*   `companyId` (String, required)
*   `companyName` (String, required)
*   `name` (String, required)
*   `email` (String, required)
*   `resumePath` (String, required path of uploaded file)
*   `status` (String, enum: `['pending', 'submitted', 'accepted', 'rejected']`, default: `'pending'`)

---

## ⚙️ Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   NPM
*   MongoDB Atlas Account & URI

### 1. Database Configuration
1. Create a `.env` file inside the `Backend/` directory:
   ```bash
   touch Backend/.env
   ```
2. Add your MongoDB Atlas connection string inside `Backend/.env`:
   ```env
   MONGO_URI=your_mongodb_connection_string
   ```

### 2. Importing Seed Data
To populate the database with initial company listings, create a `data/companies.json` file in the root directory (or import standard seed information) and execute:
```bash
node Backend/importCompanies.js
```
To check current database size and industry distribution:
```bash
node Backend/seedCompanies.js
```

### 3. Running in Development Mode
To run the frontend and backend concurrently in separate terminal sessions:

*   **Run Express Backend**:
    ```bash
    cd Backend
    npm install
    npm run dev
    ```
    *Starts the API server at [http://localhost:5002](http://localhost:5002)*

*   **Run React Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    *Starts the Vite development server at [http://localhost:5173](http://localhost:5173)*

### 4. Running in Production
To serve the React SPA directly from the Express backend:
1. Build the production version of the frontend:
   ```bash
   cd frontend
   npm run build
   ```
   *This compiles files into the `frontend/dist/` directory.*
2. Start the Backend server in production:
   ```bash
   cd ../Backend
   npm start
   ```
   *The Express app will serve the compiled React app at [http://localhost:5002](http://localhost:5002) and handle client routing gracefully.*

---

## 📡 API Reference

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | Registers a new user account | No |
| `/api/auth/login` | POST | Authenticates user & sets session | No |
| `/api/auth/logout` | POST | Destroys current user session | Yes |
| `/api/auth/profile` | GET / PUT | Fetch or update profile information | Yes |
| `/api/companies` | GET | List all available companies | Yes |
| `/api/companies/search`| GET | Query companies by name/industry | Yes |
| `/api/cart` | GET | Fetch user's active applications | Yes |
| `/api/cart` | POST | Add a company/application to cart | Yes |
| `/api/cart/:companyId` | DELETE | Remove application from cart | Yes |
| `/upload-resume` | POST | Upload PDF/Doc resume file using Multer | Yes |