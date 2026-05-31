# Furnituree - Furniture E-commerce Web Application

Furnituree is a full-stack furniture e-commerce web application built for the Web Application Development final project. The system supports public product browsing, customer cart and checkout, admin/manager inventory management, user management, review moderation, wishlist, CSV export, dashboard metrics, and real-time chat.

## Team Members and Roles

Update this section before submission.

| Member            | Role                               | Main Contributions                                                      |
| ----------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| Trần Lê Minh Quân | Backend / Database / Documentation | Spring Boot APIs, database schema, seed data, security, deployment docs |
<<<<<<< HEAD
| Nguyễn Phước Thịnh | Frontend / UI | HTML/CSS/JS pages, responsive layout, catalog UI |

=======
| Member 2          | Frontend / UI                      | HTML/CSS/JS pages, responsive layout, catalog UI                        |
>>>>>>> 0964c68 (Refactor model classes for improved readability and consistency)

## Technology Stack

| Layer      | Technology                                         |
| ---------- | -------------------------------------------------- |
| Frontend   | HTML5, CSS3, Vanilla JavaScript                    |
| Backend    | Java 21, Spring Boot 3.5.11                        |
| Database   | MySQL / MariaDB, Spring Data JPA/Hibernate         |
| Security   | Spring Security, JWT, BCrypt                       |
| Real-time  | Spring WebSocket + STOMP + SockJS                  |
| Build      | Maven Wrapper                                      |
| Deployment | Docker / Docker Compose, Render/Railway-compatible |

## Main Features

- Secure registration, login, logout with JWT and BCrypt password hashing.
- 3 roles: `ADMIN`, `MANAGER`, `CUSTOMER`.
- Role-based access control for admin and manager operations.
- Product CRUD with soft delete, audit log, validation, image upload, CSV export.
- Category CRUD and product-tag many-to-many relationship.
- Advanced product search/filter/sort/pagination.
- Cart management and checkout.
- Order workflow: `PENDING -> CONFIRMED -> SHIPPED -> COMPLETED` or cancellation.
- Business rules: stock validation, overselling prevention, total/discount/tax/shipping calculation.
- Wishlist and review moderation.
- Admin dashboard metrics.
- Real-time chat using WebSocket.
- Database schema, seed data, ER diagram, API docs, deployment guide.

## Prerequisites

- Java 21+
- MySQL 8+ or MariaDB 10+
- Maven Wrapper included in project
- Optional: Docker + Docker Compose

## Environment Variables

Copy `.env.example` to `.env` or configure these values in your hosting platform.

| Variable      | Default                                           | Description               |
| ------------- | ------------------------------------------------- | ------------------------- |
| `PORT`        | `8080`                                            | Server port               |
| `DB_URL`      | `jdbc:mysql://localhost:3306/furniture_store?...` | MySQL JDBC URL            |
| `DB_USERNAME` | `root`                                            | Database username         |
| `DB_PASSWORD` | `root`                                            | Database password         |
| `DDL_AUTO`    | `update`                                          | Hibernate schema strategy |
| `JWT_SECRET`  | provided fallback                                 | JWT signing secret        |
| `UPLOAD_DIR`  | `uploads`                                         | Image upload folder       |

## Local Setup

### 1. Create database

```sql
CREATE DATABASE IF NOT EXISTS furniture_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

You can use your old `furniture_store` database. The project uses `spring.jpa.hibernate.ddl-auto=update`, so existing product/cart/user tables can be updated instead of recreated.

### 2. Optional: run schema and seed scripts

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p furniture_store < database/seed-data.sql
```

The application also includes `DataSeeder`, which automatically creates test users, categories, tags, and 100 products when needed.

### 3. Run backend

Linux/macOS:

```bash
chmod +x mvnw
./mvnw spring-boot:run
```

Windows:

```bat
mvnw.cmd spring-boot:run
```

Open the app at:

```text
http://localhost:8080/
```

## Test Accounts

| Role     | Username   | Email               | Password       |
| -------- | ---------- | ------------------- | -------------- |
| Admin    | `admin`    | `admin@test.com`    | `Admin123!`    |
| Manager  | `manager`  | `manager@test.com`  | `Manager123!`  |
| Customer | `customer` | `customer@test.com` | `Customer123!` |

## Useful API Examples

Login:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'
```

Search products:

```bash
curl "http://localhost:8080/api/v1/products?keyword=chair&minPrice=100&maxPrice=1000&page=0&size=10&sortBy=price&sortDir=asc"
```

## Run with Docker Compose

```bash
docker compose up --build
```

App: `http://localhost:8080`  
Database: `localhost:3306`, database `furniture_store`

## Project Structure

```text
project-root/
├── README.md
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── database/
│   ├── schema.sql
│   ├── seed-data.sql
│   ├── ER-diagram.png
│   └── ER-diagram.drawio
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── CONTRIBUTING.md
│   └── MANUAL_COMPLIANCE.md
├── font-end/
│   ├── htmlpage/
│   ├── jsLogical/
│   └── style/
├── src/main/java/com/furnituree/furnituree/
│   ├── Controller/
│   ├── config/
│   ├── dto/
│   ├── exception/
│   ├── model/
│   ├── repo/
│   ├── service/
│   └── util/
└── src/main/resources/static/
```

## Known Limitations

- Payment integration is simulated with COD/PENDING statuses; real VNPay/Stripe can be added later.
- Email verification is represented in the model but not connected to a real SMTP provider.
- The frontend is intentionally vanilla JavaScript to demonstrate fundamentals; it can be upgraded to React/Vue for a larger production app.

## Live Demo URL

Add your deployed URL here before submission.

```text
TODO: https://your-deployed-furnituree-app.example.com
```

## Screenshots

Add final screenshots to `docs/screenshots/` before submission and reference them in the technical report.

### Frontend URL note

Recommended: open the application through Spring Boot at `http://localhost:8080`.
If you open HTML files through VS Code Live Server at `http://127.0.0.1:5500`, the JavaScript now automatically sends API requests to `http://localhost:8080`. Make sure the Spring Boot backend is running first; otherwise login/register/cart requests will fail.

If Chrome DevTools shows errors from `background.js` or `chrome-extension://...`, those usually come from browser extensions, not this project. Test again in Incognito mode with extensions disabled if needed.
