# Pocket Tesla, Tesla API - PoC


<p align="center">
  <img src="pocket-tesla.png" height="400" />
</p>


A NestJS v10 backend API for managing Tesla vehicles, alerts, and user authentication. This is a proof of concept that demonstrates integration with Tesla Fleet API, MongoDB for data storage, and comprehensive audit logging.

## Features

### Authentication
- JWT-based authentication with 7-day token expiration
- User registration with email, password, phone, and fullname
- Tesla Account OAuth2 connection
- Secure password hashing with bcrypt

### Vehicle Management
- List all Tesla vehicles associated with a user
- Get detailed vehicle status and information
- Send commands to vehicles (wake up, honk, flash, lock, unlock, set charge limit)
- Automatic vehicle state tracking

### Alert System
- Create custom alert rules for vehicles
- Three alert types supported:
  - LOW_BATTERY: Triggers when battery falls below threshold
  - CHARGING_STOPPED: Triggers when charging is disconnected
  - VEHICLE_ASLEEP_TOO_LONG: Triggers when vehicle is asleep for extended period
- Background job checks alert rules every 5 minutes
- Alert event history tracking

### Audit Logging
- Comprehensive logging of all user actions
- Async, non-blocking logging (never affects user experience)
- Logs include: user ID, action, entity type, entity ID, metadata, IP address, user agent
- JWT-protected endpoint for viewing audit logs
- Pagination and filtering support

## API Endpoints

### Authentication (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/login | Authenticate with email and password |
| POST | /api/v1/auth/register | Register a new user account |
| GET | /api/v1/auth/tesla/connect | Initiate Tesla OAuth connection |
| GET | /api/v1/auth/tesla/callback | Handle Tesla OAuth callback |

### Vehicles (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/vehicles | List all user vehicles |
| GET | /api/v1/vehicles/:id/status | Get specific vehicle status |
| POST | /api/v1/vehicles/:id/commands | Send command to vehicle |

### Alerts (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/alerts | Create a new alert rule |
| GET | /api/v1/alerts | List all alert rules |
| GET | /api/v1/alerts/events | List triggered alert events |
| DELETE | /api/v1/alerts/:id | Delete an alert rule |

### Audit Logs (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/audit-logs | List audit logs with filtering |
| GET | /api/v1/audit-logs/entity/:entityType/:entityId | Get logs for specific entity |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Tesla Developer Account (for API access)

### Environment Variables
Create a .env file in the root directory:

```
MONGO_URI=mongodb://localhost:27017/pocket-tesla
JWT_SECRET=your-jwt-secret-key
TESLA_CLIENT_ID=your-tesla-client-id
TESLA_CLIENT_SECRET=your-tesla-client-secret
TESLA_REDIRECT_URI=http://localhost:3000/api/v1/auth/tesla/callback
PORT=3000
```

### Installation
```bash
npm install
```

### Running the Application
```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod
```

## Swagger API Documentation

The API is fully documented using OpenAPI/Swagger. Access the interactive documentation at:

**http://localhost:3000/api**

### Using Swagger UI
1. Open http://localhost:3000/api in your browser
2. Click on any endpoint to expand its details
3. Click "Try it out" to test the endpoint
4. For protected endpoints, first authorize using the JWT token:
   - Click the "Authorize" button at the top right
   - Enter your JWT token in the format: `Bearer <your-token>`
   - Click Authorize

### Swagger Features
- Interactive API exploration
- Request/response schemas
- Parameter documentation
- Response codes and examples
- JWT authentication integration

## Architecture

### Module Structure
- **AuthModule**: Handles authentication, JWT tokens, and Tesla OAuth
- **UsersModule**: User management and data storage
- **VehiclesModule**: Tesla vehicle integration and commands
- **AlertsModule**: Alert rules and event processing
- **AuditLogsModule**: Async audit logging (global module)

### Technology Stack
- NestJS v10
- MongoDB with Mongoose
- JWT Authentication
- OpenAPI/Swagger
- NestJS Schedule (cron jobs)

### Database Collections
- users: User accounts and Tesla tokens
- vehicles: User vehicle references
- alertrules: Alert rule definitions
- alertevents: Triggered alert history
- auditlogs: User action audit trail

## Security Features

- Password hashing with bcrypt (14 rounds)
- JWT tokens with 7-day expiration
- All sensitive endpoints require JWT authentication
- Audit logging for compliance and debugging
- Input validation using class-validator
- Non-blocking audit logging (never impacts user experience)

## API Capabilities

### Tesla Integration
This POC demonstrates the foundation for Tesla Fleet API integration:
- OAuth2 authentication flow
- Vehicle data retrieval
- Vehicle command execution

### Alert Monitoring
The alert system runs as a background job:
- Checks all enabled alert rules every 5 minutes
- Prevents duplicate alerts (5-minute window)
- Supports multiple alert types
- Tracks alert history

### Audit Trail
Every sensitive action is logged:
- User login/logout
- Tesla account connection/disconnection
- Vehicle commands executed
- Alert rule creation/deletion
- Alert triggers

Logs include:
- User ID
- Action performed
- Entity type and ID
- Metadata (command details, success status, etc.)
- IP address
- User agent
- Timestamp

## Project Status

This is a proof of concept. The following features are implemented:
- User authentication and registration
- Tesla OAuth connection
- Vehicle listing and status
- Vehicle commands (basic)
- Alert rules and events
- Audit logging
- Swagger documentation

Potential enhancements for production:
- Refresh token mechanism
- Rate limiting
- More vehicle command types
- Alert notifications (email, push)
- Admin user management
- Enhanced error handling
- Unit and e2e tests
