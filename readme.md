# Pranilsthaa Trimester 3 Project Backend

A robust, role-based authentication and management backend built with Node.js and Express.js, leveraging MySQL for data persistence. This project is designed to serve as the secure and scalable backend for a multi-role (Manager, Client, Auditor, Admin) system, focusing on advanced cybersecurity practices, permission management, and user authentication.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Overview](#api-overview)
- [Database Structure](#database-structure)
- [Security Highlights](#security-highlights)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Role-Based Access Control (RBAC):** Supports Manager, Client, Auditor, and Admin roles, each with dedicated endpoints and permission checks.
- **JWT Authentication:** Secure login, session management, and token-based authentication.
- **Two-Factor Authentication (2FA):** Additional layer of user security.
- **Password Management:** Secure password hashing, password history checks to prevent reuse, and password update endpoints.
- **Permission System:** Fine-grained permissions mapped to user roles for strict API access control.
- **Audit & Activity Logging:** Endpoints and logic for activity tracking and reporting.
- **Rate Limiting & Captcha:** Brute force protection using rate limits and optional captcha integrations.
- **Email Notifications:** Email-based OTPs and notifications via Nodemailer.
- **RESTful API Design:** Organized controllers for each domain (auth, admin, client, auditor, manager, user).
- **CORS, Cookie Management, and Secure Headers:** Best practices for API security and interoperability.

---

## Architecture

```
📁 controller/
    ├── adminController.js      # Admin operations (role/permission management)
    ├── auditor.js              # Auditor-specific endpoints
    ├── authController.js       # Authentication logic (login, register, 2FA, etc.)
    ├── clientController.js     # Client-specific endpoints
    ├── managerController.js    # Manager-specific endpoints
    └── userController.js       # User profile, permission fetch, etc.
📁 middleware/
    └── authMiddleware.js       # Authentication & permission middlewares
📁 helper/
    ├── encrypt.js              # Data encryption utilities
    ├── generateOTP.js          # OTP generation
    ├── mailService.js          # Email sending logic
    └── passwordHistory.js      # Password reuse prevention
📄 connection.js                # MySQL connection and query utilities
📄 package.json                 # Project dependencies and scripts
```

---

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Pranilsthaa/Pranilsthaa-Trimester_3_Project_Backend.git
   cd Pranilsthaa-Trimester_3_Project_Backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up your database:**

   - Configure a MySQL database named `Adv_Cyber_Security` (or update `connection.js`).
   - Import your schema and seed data as needed.

4. **Configure environment variables:**  
   Create a `.env` file in the root directory (see below).

---

## Environment Variables

| Variable             | Description                       |
| -------------------- | --------------------------------- |
| `CAPTCHA_SECRET_KEY` | Google ReCaptcha secret (if used) |
| `EMAIL_USER`         | Email account for notifications   |
| `EMAIL_PASS`         | Email password or app token       |
| ...                  | (Any others as required)          |

Example `.env`:

```env
CAPTCHA_SECRET_KEY=your_captcha_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

---

## Usage

- **Development:**

  ```bash
  npm run dev        # if using nodemon
  node index.js      # or your entrypoint
  ```

- **API Base URL:**  
  Default: `http://localhost:3000/`

---

## API Overview

### Authentication

- `POST /login` — User login (supports captcha after failed attempts)
- `POST /register` — Register new user
- `POST /logout` — Logout
- `POST /verify-email` — Email verification
- `POST /verify-otp` — OTP verification (2FA)
- `POST /change-password` — Change password (with history check)

### Role-Specific Endpoints

- **Admin:** `/admin/get-users`, `/admin/update-role`, `/admin/update-permission`
- **Manager:** `/manager/verify`
- **Client:** `/client/verify`, `/client/get-reports`, `/client/tickets`
- **Auditor:** `/auditor/verify`, `/auditor/dashboard`, `/auditor/reports`

### User

- `GET /user/permissions` — Fetch permissions for logged-in user
- `GET /user/profile` — Get user profile

> **Note:** All endpoints are protected by middleware enforcing authentication and/or permissions.

---

## Database Structure

- **user_cred:** Users table (id, username, password, role, 2fa, etc.)
- **user_roles:** Role definitions
- **user_permission:** List of permissions
- **role_permission:** Many-to-many mapping (roles ↔ permissions)
- **password_history:** Historical hashes to prevent reuse

> See your database folder or schema migration scripts for exact schema.

---

## Security Highlights

- **Passwords**: Hashed via bcrypt, never stored in plain text.
- **JWT**: Short-lived, httpOnly cookies for session security.
- **Role & Permission Checks**: Every sensitive route is protected.
- **Password Reuse Prevention**: Enforced via password history checks.
- **Brute Force Mitigation**: Rate limiting and captcha validation.
- **Email Verification & 2FA**: Secure onboarding and authentication.

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

---

## License

[ISC](LICENSE)  
Copyright (c) Pranilsthaa

---

## Contact

For questions or support, please contact [Pranilsthaa](https://github.com/Pranilsthaa).
