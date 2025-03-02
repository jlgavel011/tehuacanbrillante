# Elevator Pitch
This application streamlines the management of production lines by mapping maintenance errors across systems, subsystems, and sub-subsystems while tracking product-specific production orders and performance. It enables production managers at Tehuacán Brillante to assign production orders, monitor real-time output, and analyze downtime causes to optimize production efficiency and quality.

# Who is this App For
- **Primary User:** Tehuacán Brillante – a production company.
- **User Roles:**
  - Production Manager: Oversees production orders, tracks production progress, and analyzes downtime.
  - Production Line Chief: Manages daily production reporting and interacts with the production portal.
  - Manager (via master login): Administers user access and overall system configuration.

# Functional Requirements
- **Production Line Mapping:**
  - Create and manage production lines with detailed hierarchies (systems, subsystems, sub-subsystems).
  - Map maintenance errors to specific components of the production line.
- **Product Creation:**
  - Configure products based on flavor, model, size, packaging, and raw materials.
  - Associate products with production machinery.
- **Production Order Management:**
  - Create production orders by assigning a production date, product, and machine.
  - Generate unique order numbers for easy lookup by production managers.
- **Real-time Production Reporting:**
  - Allow production managers to report the number of boxes produced every hour.
  - Calculate and display expected production output and track downtime.
  - Classify downtime reasons into maintenance, quality, and operational issues.
    - Maintenance: Detailed assignment based on registered production line components.
    - Quality: Log quality stoppages.
    - Operational: Capture remaining downtime with affected system details.
- **Analytics & Reporting:**
  - Generate reports on failure frequency across production lines and components.
  - Provide analytics on:
    - Most produced flavors, presentations, and box types.
    - Average boxes per hour for specific product sizes.
    - Total boxes produced within a specified time frame.
    - Boxes produced per production line.
    - Most common waste types.
- **User Management & Access Control:**
  - Master login for overall system administration.
  - Separate login for managers with the ability to create new manager users.
  - Two distinct portals: one for managers and another for production personnel.
- **Data Storage:**
  - Robust database to store production line details, production orders, real-time production data, and analytics.

# User Stories
- **As a Production Manager:**
  - I want to log in to the system and view all production orders, so I can know which machine is assigned which product.
  - I want to create new production orders by assigning production dates and products to specific machines.
  - I want to view real-time production reports and downtime analytics to quickly identify issues.
  - I want to generate detailed reports to analyze which parts of the production line experience the most failures.
- **As a Production Line Chief:**
  - I want to log in via the production portal from my desktop, tablet, or mobile device to report the number of boxes produced every hour.
  - I want to view my production order details to know which product I need to produce on my line.
  - I want to quickly log downtime reasons (maintenance, quality, operational) for accurate production tracking.
- **As a Manager (with master login):**
  - I want to manage user accounts and access controls for both manager and production roles.
  - I want to update the production line mappings and product details as needed.

# User Interface
- **Design Approach:**
  - **Responsive Design:** Interface optimized for desktop, laptop, tablet, and mobile devices.
  - **Two Portals:**
    - **Manager Portal:** Focused on administrative tasks, production order creation, analytics dashboards, and detailed reporting.
    - **Production Portal:** Streamlined interface for production line chiefs to quickly log production data and view order details.
- **Layout & Navigation:**
  - Intuitive dashboard layout with quick access to key functions like production order lookup, reporting forms, and analytics.
  - Clear navigation menus for switching between production order management, user management, and reporting sections.
- **Visual Elements:**
  - Data visualization components for displaying production analytics and downtime breakdowns.
  - Forms and input fields designed for ease-of-use and minimal data entry errors.
