#  Campus Event Portal

A full-stack web application designed to simplify campus event management by providing a centralized platform where students can explore events, organizers can create and manage events, and administrators can oversee platform activities.

The **Campus Event Portal** aims to make campus event coordination more accessible, organized, and efficient through role-based access control and a dedicated dashboard experience.

---

##  Key Features

### 👤 User Authentication & Authorization
- Secure user registration and login.
- Role-based access control.
- Separate access permissions for Admins, Organizers, and Students.
- Protected pages and dashboard access based on user roles.

###  Event Management
- Create and publish campus events.
- View available events and event details.
- Manage event information and updates.
- Organize campus activities through a centralized platform.

###  Organizer Dashboard
- Dedicated dashboard for authorized organizers.
- Access event management functionality.
- Manage events associated with the organizer account.
- View relevant event information and activities.

###  Student Experience
- Explore available campus events.
- Access event information.
- Interact with the event portal based on student permissions.

###  Admin Management
- Administrative access to platform functionality.
- Manage platform users and their roles.
- Oversee event-related activities.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Backend | Backend REST API |
| Database | MongoDB |
| Database Hosting | MongoDB Atlas / Local MongoDB |
| Authentication | Role-Based Authentication |
| Version Control | Git & GitHub |

---

##  Project Architecture

The application follows a separated frontend-backend architecture.

```text
Campus-Event-Portal/
│
├── backend/
│   ├── Configuration files
│   ├── Database connection
│   ├── API routes
│   ├── Controllers
│   ├── Middleware
│   ├── Models
│   └── Server configuration
│
├── frontend/
│   └── campus/
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── assets/
│       │   └── services/
│       ├── package.json
│       └── vite.config.js
│
├── .gitignore
└── README.md
```

---

##  Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Aryan273-rio/Campus-Event-Portal.git

cd Campus-Event-Portal
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install the dependencies:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Replace the MongoDB connection string with your local MongoDB URI or MongoDB Atlas connection string.

**Important:** Never commit your `.env` file or expose database credentials and secret keys publicly.

### 4. Start the Backend Server

Run the backend using the development script configured in `package.json`.

```bash
npm run dev
```

### 5. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd Campus-Event-Portal/frontend/campus
```

Install dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

---

##  Role-Based Access Control

The portal provides different levels of access depending on the authenticated user's role.

| Functionality | Admin | Organizer | Student |
|---|:---:|:---:|:---:|
| Access platform | ✅ | ✅ | ✅ |
| View events | ✅ | ✅ | ✅ |
| Access organizer dashboard | ✅ | ✅ | ❌ |
| Create events | ✅ | ✅ | ❌ |
| Manage events | ✅ | Own events | ❌ |
| Administrative management | ✅ | ❌ | ❌ |

*Access permissions are determined by the application's authorization logic.*

---

## 🗄️ Database

The application uses **MongoDB** for data storage.

MongoDB can be configured using either:
- A locally hosted MongoDB instance.
- MongoDB Atlas for cloud-based database hosting.

Configure the database connection through the `MONGO_URI` environment variable.

---

##  Security Considerations

- Environment variables are used to store sensitive configuration.
- Database credentials should never be committed to version control.
- Protected routes should validate user authentication.
- Role-based authorization should be enforced on both frontend and backend.
- Unauthorized users should not be able to access restricted API endpoints.

---

##  Future Enhancements

Potential improvements to the platform include:

- Event registration and participant management.
- Automated event reminders and notifications.
- Event attendance tracking.
- Event analytics and reporting.
- Calendar integration.
- Improved dashboard analytics.
- Enhanced mobile responsiveness.

---

##  Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes.
4. Push the branch to your fork.
5. Submit a Pull Request.

---

##  Author

**Aryan SV**

- GitHub: [@Aryan273-rio](https://github.com/Aryan273-rio)
- Project Repository: [Campus Event Portal](https://github.com/Aryan273-rio/Campus-Event-Portal)

---

⭐ If you find this project interesting, consider giving the repository a star!

**Built to make campus event management simpler, smarter, and more organized.**
