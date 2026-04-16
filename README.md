<div align="center">

# 💰 Money Manager

### *Your personal finance companion — track income, set budgets, and take control of your money.*

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white"/>
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/>
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white"/>
  <img src="https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apache-maven&logoColor=white"/>
  <img src="https://img.shields.io/badge/Gmail_SMTP-EA4335?style=for-the-badge&logo=gmail&logoColor=white"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square"/>
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square"/>
  <img src="https://img.shields.io/badge/Java-17+-orange?style=flat-square"/>
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=flat-square"/>
  <img src="https://img.shields.io/badge/Last_Commit-April_2025-blueviolet?style=flat-square"/>
</p>

</div>

---

## 📌 About The Project

**Money Manager** is a secure, full-stack web application that helps users track income and expenses, set category-wise budgets, and view financial summaries on a dashboard.

> 💡 **Did you know?** Most people overspend simply because they don't track — Money Manager gives you the visibility to change that.

It features **JWT-based authentication** with **OTP email verification** for secure sign-up and login, and follows a clean layered architecture:

- **React Frontend** — UI with protected routes, context-based auth state, and REST API calls
- **Spring Boot Backend** — RESTful API with JWT security, service layer, JPA repositories, and MySQL persistence

---

## ✨ Features

| Feature | Description |
|---|---|
|  **Auth** | Sign up & Sign in with JWT token |
|  **OTP Verification** | Email-based OTP via Gmail SMTP |
|  **Transactions** | Add, view, and categorize income/expense entries |
|  **Budget** | Set and track category-wise monthly budgets |
|  **Dashboard** | Summary of balance, spending, and budget status |
|  **Protected Routes** | Frontend routes guarded by auth context |

---

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![Context API](https://img.shields.io/badge/Context_API-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

### Backend
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=spring-security&logoColor=white)
![Spring Data JPA](https://img.shields.io/badge/Spring_Data_JPA-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apache-maven&logoColor=white)

### Database & Auth
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![Gmail SMTP](https://img.shields.io/badge/Gmail_SMTP-EA4335?style=for-the-badge&logo=gmail&logoColor=white)

---

## 📂 Project Structure

```
MoneyManager/
│
├── moneymanager-frontend/              # React app
│   └── src/
│       ├── api/
│       │   └── api.js                  # Axios API calls to backend
│       ├── components/
│       │   ├── AppShell.js             # Main layout shell
│       │   ├── Field.js                # Reusable form field
│       │   └── PrivateRoute.js         # Auth-guarded route wrapper
│       ├── context/                    # Auth context (global state)
│       ├── pages/                      # All page components
│       ├── styles/                     # CSS files
│       ├── App.js                      # Routes setup
│       └── index.js                    # Entry point
│
└── src/main/java/com/gayatri/MoneyManager/
    ├── controller/
    │   ├── AuthController              # /api/auth — signup, signin, verify OTP
    │   ├── TransactionController       # /api/transactions
    │   ├── BudgetController            # /api/budgets
    │   └── DashboardController         # /api/dashboard
    ├── dto/
    │   ├── ApiResponse
    │   ├── AuthResponse
    │   ├── BudgetRequest / BudgetResponse
    │   ├── DashboardResponse
    │   ├── SigninRequest / SignUpRequest
    │   ├── TransactionRequest / TransactionResponse
    │   ├── UserDto
    │   └── VerifyOtpRequest
    ├── entity/
    │   ├── Budget
    │   ├── OtpToken
    │   ├── Transaction
    │   └── User
    ├── repository/                     # Spring Data JPA repositories
    ├── security/                       # JWT filter, config, UserDetails
    ├── service/                        # Business logic layer
    └── resources/
        ├── static/
        ├── templates/
        └── application.properties      # ⚠️ Not pushed — see setup below
```

---

## ⚙️ How It Works

1. **Sign Up** — User registers → backend sends OTP to email → user verifies → account activated
2. **Sign In** — Credentials validated → JWT token issued → stored in frontend (localStorage/context)
3. **Protected Access** — Every API request sends JWT in `Authorization: Bearer <token>` header → Spring Security validates it
4. **Transactions** — User adds income/expense with category, amount, date → stored in MySQL
5. **Budget** — User sets monthly budget per category → compared against transactions in real time
6. **Dashboard** — Aggregates total balance, monthly spending, and budget usage via `DashboardController`

---

## 🚀 Setup & Run

### Prerequisites

- ☕ Java 17+
- 🟢 Node.js 18+
- 🐬 MySQL running locally
- 📧 Gmail account with [App Password](https://myaccount.google.com/apppasswords) enabled

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/gayatri-nawale/money-manager.git
cd MoneyManager
```

---

### Step 2 — Set Up the Database

Open MySQL and run:

```sql
CREATE DATABASE moneymanager;
```

---

### Step 3 — Configure `application.properties`

In `src/main/resources/`, rename `application.properties.example` to `application.properties` and fill in your values:

```properties
# —— Database ———————————————————————————————
spring.datasource.url=jdbc:mysql://localhost:3306/moneymanager
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD

# —— JPA ————————————————————————————————————
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# —— Authentication —————————————————————————
jwt.secret=YOUR_JWT_SECRET_KEY_MIN_32_CHARS

# —— Email (Gmail SMTP) —————————————————————
spring.mail.username=YOUR_GMAIL_ADDRESS
spring.mail.password=YOUR_GMAIL_APP_PASSWORD
```


**How to get credentials:**
- **Gmail App Password** → [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) → Generate App Password
- **JWT Secret** → Any random string of at least 32 characters

---

### Step 4 — Run the Backend

```bash
# From project root (Mac/Linux)
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

Backend starts at `http://localhost:8080`

---

### Step 5 — Run the Frontend

```bash
cd moneymanager-frontend
npm install
npm start
```

Frontend starts at `http://localhost:3000`

---


## 🌐 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new user | ❌ |
| `POST` | `/api/auth/verify-otp` | Verify email OTP | ❌ |
| `POST` | `/api/auth/signin` | Login & get JWT | ❌ |
| `GET` | `/api/transactions` | Get all transactions | ✅ |
| `POST` | `/api/transactions` | Add a transaction | ✅ |
| `GET` | `/api/budgets` | Get all budgets | ✅ |
| `POST` | `/api/budgets` | Set a budget | ✅ |
| `GET` | `/api/dashboard` | Get dashboard summary | ✅ |

---


## 👩‍💻 Author

**Gayatri Nawale**


