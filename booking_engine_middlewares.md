# Booking Engine – Middleware Architecture

This document defines the middleware stack used by the Booking Engine backend.
Middlewares are responsible for **security, validation, authorization, consistency, and observability**, and must be applied in a strict order.

---

## 🔗 Middleware Execution Order (Important)

Recommended global order for protected routes:

1. Request Context Middleware
2. Rate Limiting Middleware
3. Idempotency Middleware (for write APIs)
4. Authentication Middleware
5. Authorization (Permission) Middleware
6. Joi Validation Middleware
7. Controller / Handler
8. Audit Logging Middleware (post-success)
9. Error Handling Middleware

---

## 1. Request Context Middleware

**Purpose**

* Attach request-scoped metadata used across the system

**Responsibilities**

* Generate `request_id` (UUID)
* Capture:

  * IP address
  * User agent
* Attach to `req.context`

**Used by**

* AuditLog
* Logs
* Error tracking

---

## 2. Joi Validation Middleware

**Purpose**

* Validate all external inputs before business logic runs

**Responsibilities**

* Validate:

  * Request body
  * Query parameters
  * Path parameters
  * Headers (if required)
* Reject unknown fields (fail closed)
* Normalize validated data

**Behavior**

* On validation failure:

  * Return `400 Bad Request`
  * Include structured validation errors
* No partial validation allowed

**Notes**

* Validation runs **after auth**, but **before controller**
* Business validation (availability, pricing rules) happens later

---

## 3. Authentication Middleware

**Purpose**

* Authenticate the caller and attach identity to request

**Mechanism**

* JWT-based authentication (stateless)

**Responsibilities**

* Extract JWT from:

  * `Authorization: Bearer <token>`
* Verify token signature & expiration
* Load user from DB
* Validate:

  * user.is_active = true
  * role.is_active = true
  * account not locked (`locked_until`)
* Attach authenticated user to `req.user`

**Failure Behavior**

* Invalid or missing token → `401 Unauthorized`
* Inactive user or role → `403 Forbidden`
* Locked account → `423 Locked`

---

## 4. Authorization / Permission Middleware

**Purpose**

* Enforce role-based access control (RBAC)

### Core Authorization Flow

1. **Resolve User Permissions**

   * Load permissions via:

     * user → role → role_permissions
   * Optionally cache per request

2. **Define Required Permissions**

   * Each route explicitly declares:

     * One permission
     * Or a list of acceptable permissions

   Example:

   ```js
   requirePermission('BOOKING_CREATE')
   ```

3. **Permission Evaluation**

   * If user has required permission → allow
   * Else → deny with `403 Forbidden`

---

### Object-Level Authorization (Optional)

Performed **after permission check**, inside middleware or controller.

**Examples**

* User can edit only bookings they created
* Receptionist can manage bookings only for their hotel
* Refunds allowed only for payments belonging to same hotel

**Rule**

* Never rely solely on permission names for object ownership

---

## 5. Idempotency Middleware (Critical Write APIs)

**Purpose**

* Prevent duplicate execution of write operations

**Applies To**

* Booking creation
* Payment initiation
* Refund initiation

**Responsibilities**

* Read `Idempotency-Key` header
* Hash request payload
* Check `IdempotencyKey` table:

  * If `Completed` → return stored response
  * If `InProgress` → reject or wait
  * If not found → create entry with `InProgress`
* Ensure key + payload consistency

**Failure Behavior**

* Missing key → `400 Bad Request`
* Key reuse with different payload → `409 Conflict`

---

## 6. Controller / Business Logic Layer

**Rules**

* Must assume:

  * Request is authenticated
  * Permission is verified
  * Input is validated
* All DB mutations must:

  * Run inside Prisma `$transaction`
* Must never:

  * Write audit logs directly
  * Catch and swallow errors

---

## 7. Audit Logging Middleware

**Purpose**

* Record all state-changing operations

**Triggers**

* CREATE / UPDATE / DELETE
* Authentication events
* Permission denials
* Financial operations

**Captured Data**

* user_id / actor_type
* action
* entity_type + entity_id
* before_state / after_state
* request_id, IP, user agent

**Rules**

* Audit logs are:

  * Append-only
  * Immutable
* Failures in audit logging:

  * Must not break core business logic

---

## 8. Error Handling Middleware

**Purpose**

* Centralized error normalization and response handling

**Responsibilities**

* Catch all unhandled errors
* Map internal errors to safe HTTP responses
* Log full error details internally
* Return sanitized error messages to clients

**Rules**

* Never expose:

  * Stack traces
  * SQL errors
  * Internal IDs
* Standard HTTP responses:

  * 400 – Validation error
  * 401 – Unauthorized
  * 403 – Forbidden
  * 409 – Conflict
  * 429 – Too many requests
  * 500 – Internal server error

---

## 9. Optional Supporting Middlewares

### Rate Limiting Middleware

* Applied globally and per-route
* Stricter limits for:

  * Login
  * Booking creation
  * Payment APIs

### Logging Middleware

* HTTP access logs (`morgan`)
* Structured logs (`winston`)

### CSRF Middleware

* Required only for browser-based clients
* Not needed for pure JWT APIs

---

## ✅ Middleware Design Principles

* Authentication before authorization
* Validation before mutation
* Idempotency before side effects
* Transactions for consistency
* Audit logs for accountability
* Errors are safe and boring

---
