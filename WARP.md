# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SpectraSynth CRM is a Node.js/Express-based Customer Relationship Management system for SpectraSynth Pharmachem. The system manages the complete inquiry-to-purchase-order workflow including automated email processing, quotation generation with PDF output, and role-based user management.

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL with Sequelize ORM  
- **Authentication**: JWT with bcrypt password hashing
- **PDF Generation**: Puppeteer for quotation PDFs
- **Email Processing**: IMAP with node-cron for automated email fetching
- **Task Scheduling**: node-cron for background jobs

## Development Commands

### Setup and Installation
```bash
# Navigate to backend directory (all commands run from Backend/)
cd Backend

# Install dependencies
npm install

# Start the development server
node server.js
```

### Database Operations
```bash
# Sync database models (creates tables if they don't exist)
node models/index.js
```

### Environment Setup
Create a `.env` file in the `Backend/` directory with:
- `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST` - MySQL database credentials
- `JWT_SECRET` - JWT signing secret
- Email configuration for IMAP integration

## Architecture Overview

### Directory Structure
```
Backend/
├── server.js              # Application entry point
├── config/db.js           # Sequelize database configuration
├── models/                # Sequelize model definitions
├── Controllers/           # Business logic handlers
├── Route/                 # Express route definitions  
├── middlewares/           # Authentication & permission middleware
├── Services/              # Business services (PDF generation, email processing)
├── Crone/                 # Scheduled background tasks
└── uploads/               # File storage for generated PDFs
```

### Core Workflow Architecture

The system implements a multi-stage inquiry processing workflow:

1. **Inquiry Reception**: Automated email fetching (every minute via cron job)
2. **Technical Review**: Technical team creates preliminary quotations
3. **Management Review**: Marketing team finalizes quotations and generates PDFs
4. **Purchase Order**: PO creation and tracking

### Key Models and Relationships

- **User**: Role-based authentication system
- **Inquiry**: Central entity tracking customer inquiries through workflow stages
- **Product**: Chemical products with pricing information  
- **Quotation**: Customer quotations with revision history support
- **PurchaseOrder**: Final purchase order management

### Business Logic Patterns

- **Stage-based Processing**: Each inquiry moves through defined stages (inquiry_received → technical_review → management_review → purchase_order)
- **Status Tracking**: Separate status fields track progress within each stage
- **User Attribution**: Each stage records which user processed it and when
- **PDF Generation**: Complex HTML-to-PDF generation with company branding for quotations

### Background Services

- **Email Cron Job** (`Crone/emailCrone.js`): Runs every minute to fetch new inquiry emails
- **PDF Generation Service** (`Services/pdfgenerate.js`): Creates branded quotation PDFs with Puppeteer
- **Inquiry Number Generation**: Automated inquiry numbering system

### Authentication & Authorization

- JWT-based authentication with role-based access control
- Middleware for route protection (`middlewares/auth.js`)
- Permission-based feature access (`middlewares/checkPermission.js`)

## Common Development Patterns

### Model Definition Pattern
All models follow Sequelize patterns with:
- Explicit table naming
- Manual timestamp handling  
- Proper data type definitions with validations

### Controller Pattern
Controllers handle HTTP requests and responses:
- Input validation
- Business logic coordination
- Error handling with appropriate HTTP status codes

### Service Layer Pattern
Complex business logic is abstracted into services:
- PDF generation with template rendering
- Email processing and parsing
- File upload and storage management

### Route Organization
Routes are modularized by feature:
- Each major entity has its own route file
- Routes are consolidated in `Route/Routes.js`
- Middleware applied at appropriate levels

## File Upload Handling

The system creates an `uploads/` directory structure for storing generated PDFs. Quotation PDFs are stored in `uploads/quotations/` with filename patterns like `QUO-2024-001.pdf` or `QUO-2024-001-Rev-2.pdf` for revisions.

## Database Schema Notes

- Inquiries use string primary keys (inquiry_number) rather than auto-incrementing IDs
- Stage tracking is implemented via ENUM fields for current_stage and individual status fields
- Quotation revisions are managed through separate revision tracking models
- Product pricing is maintained in a separate ProductPrices model for flexibility

## PDF Generation Specifics

The quotation PDF generation uses Puppeteer with:
- Complete HTML templates with embedded CSS
- Base64-encoded logo embedding
- Responsive design for A4 format
- Terms and conditions templating
- Dynamic product table generation with minimum row requirements