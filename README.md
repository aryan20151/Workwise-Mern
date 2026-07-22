# WorkWise - Job Search, Job Requisitions & Candidate Hiring Portal

**WorkWise** is a modern, responsive job search, job requisition, and recruitment portal built as a decoupled Full-Stack Web Application. It features role-based access control (**Job Seeker**, **Employer**, **Admin**), Gemini AI ATS integration, a Job Requisition search hub, a Saved Jobs bookmarking system, an Application Cart, and an Employer Candidate Drag & Drop Kanban Pipeline.

---

## 🚀 Key Features

* **Role-Based Authentication & Access Control**: 
  - **Job Seekers**: Browse and search open job roles (Full Stack, MERN, Frontend, Backend, etc.), save jobs to wishlist, analyze resume match with AI, and submit applications.
  - **Employers**: Post job requisitions, manage open position listings, and track candidate applications across an interactive Drag-and-Drop Kanban pipeline (`Pending` → `Submitted` → `Accepted` / `Rejected`).
  - **Admins**: Access Admin Master Setup to create employers, manage company profiles, and assign companies via API dropdowns.
* **Job Requisition Search Hub**: Search open positions by specific roles (*Full Stack*, *MERN*, *Frontend*, *Backend*, *React*, *Python*), tech stack tags, salary budget, and location.
* **Gemini AI ATS Match & Cover Letter Generator**:
  - AI ATS match score analysis comparing candidate skills against job descriptions.
  - Automatic CV parsing and skill extraction.
  - One-click AI cover letter generation.
* **Saved Jobs Wishlist**: Dedicated bookmarking system (`/saved-jobs`) powered by `SavedRequisition` models, separate from the application cart.
* **Application Cart (`/cart`)**: Tracks draft candidate applications and resume submissions.
* **Case-Insensitive Duplicate Prevention**: Company creation enforces strict normalized space and case-insensitive uniqueness (`GOOGLE` vs `google`).
* **Password Visibility Toggle**: Interactive eye icon toggle (`FiEye` / `FiEyeOff`) across login, signup, user profile, and admin setup forms.
* **Custom Error Handling**: Graceful **404 Page Not Found** and **403 Access Denied** pages.

---

## 🛠️ Tech Stack

### Frontend
* **Library**: React (v19)
* **Routing**: React Router DOM (v7)
* **Build Tool**: Vite
* **State Management**: Zustand
* **Styling**: Tailwind CSS with `@tailwindcss/vite`
* **UI Components & Icons**: React Icons (`fi`), Lucide React, Sonner Toasts

### Backend
* **Environment**: Node.js & Express
* **Database**: MongoDB Atlas via Mongoose
* **AI Integration**: Google Gemini AI API (`@google/genai`)
* **Authentication**: Session-based (`express-session`), `bcryptjs`
* **File Uploads**: Multer (Resume & document uploads)

---

## 📁 Project Structure

```text
workwise-ejs/
├── Backend/                    # Express Backend API Server
│   ├── config/                 # Mongoose Database setup
│   ├── controllers/            # Handlers (auth, company, requisition, cart, savedRequisition, ai)
│   ├── middleware/             # Auth & Role verification (requireAuth, authorizeRoles)
│   ├── models/                 # Mongoose Schemas (User, Company, Requisition, SavedRequisition, Application)
│   ├── routes/                 # Express API routes
│   ├── server.js               # Express Backend entry point
│   └── package.json            # Backend dependencies
│
├── frontend/                   # React Frontend Client (Vite)
│   ├── src/
│   │   ├── components/         # Navbar, Footer, ProtectedRoute, PublicRoute, EditProfileModal
│   │   ├── context/            # AuthProvider Context
│   │   ├── pages/              # Home, Login, Signup, Companies, Requisitions, SavedRequisitions, Cart, Apply, Pipeline, AdminMasterSetup, NotFound, AccessDenied
│   │   ├── store/              # Zustand stores (useCartStore, useSavedJobsStore)
│   │   ├── App.jsx             # Main Router configuration
│   │   └── main.jsx            # React root mount point
│   ├── package.json            # Frontend dependencies
│   └── vite.config.js          # Vite config
│
├── uploads/                    # Directory for uploaded resume files
└── README.md                   # Project documentation
```

---

## 🗃️ Data Models

### Users (`User.js`)
* `username` (String, unique, required)
* `email` (String, unique, required)
* `password` (String, hashed using bcrypt)
* `role` (String, enum: `['jobseeker', 'employer', 'admin']`, default: `'jobseeker'`)
* `profile` (Object: `fullName`, `phone`, `address`, `skills[]`, `experience[]`, `education[]`)

### Requisitions (`Requisition.js`)
* `requisitionId` (String, unique, required)
* `title` (String, required - e.g. "Full Stack MERN Developer")
* `companyId` (String)
* `companyName` (String, required)
* `industry` (String)
* `location` (String)
* `budget` (String)
* `jobType` (String)
* `techStack` (Array of Strings)
* `description` (String)
* `postedBy` (ObjectId referencing User)

### Saved Requisitions (`SavedRequisition.js`)
* `userId` (ObjectId referencing User, required)
* `requisitionId` (String, required)
* `title` (String, required)
* `companyId` (String)
* `companyName` (String)
* `location` (String)
* `budget` (String)
* `jobType` (String)
* `techStack` (Array of Strings)

### Applications (`Application.js`)
* `userId` (ObjectId referencing User, required)
* `companyId` (String, required)
* `companyName` (String, required)
* `name` (String, required)
* `email` (String, required)
* `resumePath` (String)
* `status` (String, enum: `['pending', 'submitted', 'accepted', 'rejected']`, default: `'pending'`)

---

## 📡 API Reference Summary

| Endpoint | Method | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Authenticates user & sets session | Public |
| `/api/auth/register` | POST | Registers user account | Public |
| `/api/requisitions` | GET | List & search open platform job requisitions | Authenticated |
| `/api/requisitions` | POST | Create new job requisition | Employer / Admin |
| `/api/saved-requisitions` | GET / POST | Fetch or save bookmarked job roles | Authenticated |
| `/api/saved-requisitions/:id` | DELETE | Remove bookmarked job role | Authenticated |
| `/api/cart` | GET / POST | Fetch or add draft applications to cart | Authenticated |
| `/api/companies` | GET | List company profiles | Authenticated |
| `/api/companies` | POST / PUT | Create or update company profile | Admin |
| `/api/applications/employer` | GET | Fetch candidate applications for Kanban | Employer / Admin |
| `/api/applications/:id/status`| PATCH | Update candidate status (accepted/rejected) | Employer / Admin |
| `/api/ai/match-score` | POST | Calculate Gemini AI ATS match score | Authenticated |
| `/api/ai/generate-cover-letter`| POST | Generate AI Cover Letter | Authenticated |

---

## ⚙️ Getting Started

### 1. Backend Setup
```bash
cd Backend
npm install
npm run dev
```
*Backend server runs at [http://localhost:5000](http://localhost:5000)*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend dev server runs at [http://localhost:5173](http://localhost:5173)*