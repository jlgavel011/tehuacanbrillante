# Software Requirements Specification Document

## System Design
- **Overview:**  
  A production management system for Tehuacán Brillante that maps maintenance errors, manages production orders, and tracks real-time production data.
- **Core Modules:**  
  - Production Line Management (systems, subsystems, sub-subsystems)  
  - Product Configuration (flavor, model, size, packaging, raw materials)  
  - Production Order Management  
  - Real-time Production Reporting  
  - Downtime Analysis (maintenance, quality, operational)  
  - Analytics & Reporting  
  - User Management & Access Control

## Architecture Pattern
- **Layered Architecture:**  
  - **Presentation Layer:** Responsive UI built with Next.js and React.  
  - **Application Layer:** RESTful API endpoints that handle business logic, implemented within Next.js API routes.
  - **Data Layer:** Data persistence using Prisma ORM with MongoDB.
- **Modularization:**  
  - Separate modules for production orders, downtime tracking, analytics, and user management.
- **Scalability & Flexibility:**  
  - Designed to easily add new entities, endpoints, or services with minimal refactoring.

## State Management
- **Client-Side State:**  
  - Managed with React’s Context API or lightweight state management libraries, keeping UI state such as session info, current orders, and real-time reports.
- **Server-Side State:**  
  - Stateless API endpoints with session and authentication handled via Next Auth and JWT tokens.
- **Data Consistency:**  
  - Managed through Prisma transactions and MongoDB’s consistency models.

## Data Flow
- **User Interaction:**  
  - Users interact with a simple, intuitive UI to create production orders, log production data, and view real-time reports and analytics.
- **Flow Sequence:**  
  1. **Input:** User actions on the UI (e.g., order creation, production reporting) send requests to Next.js API routes.  
  2. **Processing:** API routes execute business logic (e.g., downtime calculations) and perform database operations via Prisma.  
  3. **Output:** Processed data is returned in JSON format for display in charts and tables on the UI.
- **Error Handling:**  
  - Input validation at the UI and API layers, with consistent error messages and HTTP status codes.

## Technical Stack
- **Front-End:**  
  - Next.js, React  
  - Tailwind CSS and Shad CN for styling and UI components
- **Back-End:**  
  - Next.js API routes  
  - Next Auth for authentication
- **Database:**  
  - MongoDB managed via Prisma ORM
- **Developer Skillset:**  
  - The system is built using Next.js, React, Tailwind CSS, Shad CN, Next Auth, Prisma, and MongoDB.

## Authentication Process (not Clerk)
- **Authentication Method:**  
  - Next Auth with JWT-based authentication.
  - Secure login with encrypted password storage.
- **Authorization:**  
  - Role-based access control for Production Manager, Production Line Chief, and Master Admin.
- **Session Management:**  
  - Tokens stored using secure HTTP-only cookies, ensuring stateless session handling.

## Route Design
- **Public Routes:**  
  - `/login` – User authentication endpoint.
- **Protected Routes:**  
  - `/dashboard` – Main user dashboard.
  - `/production-orders` – Create and view production orders.
  - `/production-lines` – Manage production lines and mappings.
  - `/reports` – Access production and downtime reports.
  - `/analytics` – View analytical summaries with charts and tables.
- **Admin Routes:**  
  - `/user-management` – Manage user accounts and access controls.

## API Design
- **General Principles:**  
  - RESTful API design using standard HTTP methods (GET, POST, PUT, DELETE).
  - JSON as the data interchange format.
- **Endpoints (Examples):**  
  - **Products:**  
    - `GET /api/productos` – Retrieve all products.  
    - `POST /api/productos` – Create a new product.
  - **Production Orders:**  
    - `POST /api/ordenes` – Create a new production order.  
    - `GET /api/ordenes` – Retrieve production orders with filtering options.
  - **Downtime (Paros):**  
    - `POST /api/paros` – Log a downtime event.  
    - `GET /api/paros` – Retrieve downtime events.
  - **Production Monitoring:**  
    - `GET /api/lineas/:id/produccion` – Get real-time production data for a specific production line.
- **Error Handling & Responses:**  
  - Standard HTTP status codes with descriptive JSON error messages.
  - Consistent response format for both successful and error scenarios.
