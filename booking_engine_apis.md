# Booking Engine – API Specification & Core Logic

This document defines **all public and admin APIs**, their responsibilities, constraints, and cross-cutting rules.

All APIs (except public search/login) require:

* JWT authentication
* Permission checks
* Audit logging
* Structured error responses

---

## 🔐 Authentication & Session APIs

### 1.1 Login

`POST /auth/login`

**Purpose**

* Authenticate user and issue JWT

**Logic**

* Validate username + password
* Increment failed_login_attempts on failure
* Lock account after configured threshold
* Issue JWT with:

  * user_id
  * role_id
  * permissions (optional claim)
* Update `last_login_at`

**Audit**

* LOGIN_SUCCESS / LOGIN_FAILED

---

### 1.2 Logout

`POST /auth/logout`

* Stateless JWT logout (client-side discard)
* Optional token blacklist (future)

---

## 👤 Users Management

### 2.1 Create User

`POST /users`

**Permission**

* `USER_CREATE`

**Rules**

* username, email, mobile must be unique
* role must be active
* Password hashed with bcrypt
* Cannot assign SUPERADMIN unless caller is SUPERADMIN

**Audit**

* CREATE_USER

---

### 2.2 Update User

`PUT /users/{id}`

**Permission**

* `USER_EDIT`

**Rules**

* Cannot modify self role
* Cannot activate/deactivate SUPERADMIN
* Reset failed attempts on password change

---

### 2.3 Activate / Deactivate User

`PATCH /users/{id}/status`

**Permission**

* `USER_EDIT`

**Rules**

* Inactive users cannot login
* Existing sessions invalidated

---

### 2.4 List Users

`GET /users`

**Features**

* Pagination
* Filter by role, is_active
* Include role + permissions

---

## 🛡 Roles & Permissions

### 3.1 Create Role

`POST /roles`

**Permission**

* `ROLE_CREATE`

**Rules**

* name immutable
* Cannot create system roles via API

---

### 3.2 Update Role

`PUT /roles/{id}`

**Permission**

* `ROLE_EDIT`

**Rules**

* Cannot modify SUPERADMIN
* Cannot deactivate role with active users

---

### 3.3 Assign Permissions

`PUT /roles/{id}/permissions`

**Permission**

* `ROLE_ASSIGN_PERMISSION`

---

### 3.4 List Roles

`GET /roles`

* Include permissions
* Include is_active

---

## 🏨 Hotels

### 4.1 Create Hotel

`POST /hotels`

**Permission**

* `HOTEL_CREATE`

**Rules**

* Name must be unique
* Timezone & currency mandatory
* is_active defaults to true

---

### 4.2 Update Hotel

`PUT /hotels/{id}`

**Permission**

* `HOTEL_EDIT`

---

### 4.3 Activate / Deactivate Hotel

`PATCH /hotels/{id}/status`

**Rules**

* Inactive hotels:

  * No new bookings
  * Existing bookings unaffected

---

### 4.4 List Hotels

`GET /hotels`

**Filters**

* name
* is_active
* location (future)

---

### 4.5 Get Hotel Details

`GET /hotels/{id}`

* Includes:

  * Room types
  * Add-ons
  * Active pricing rules
  * Taxes

---

## 🛏 Room Types & Rooms

### 5.1 Create Room Type

`POST /room-types`

**Permission**

* `ROOM_TYPE_CREATE`

**Rules**

* base_price ≥ 0
* capacity validation

---

### 5.2 Update Room Type

`PUT /room-types/{id}`

**Rules**

* Cannot reduce capacity below existing bookings

---

### 5.3 Create Room

`POST /rooms`

**Rules**

* Unique (hotel_id, room_number)

---

### 5.4 Update Room

`PUT /rooms/{id}`

**Rules**

* Status change affects availability
* Maintenance blocks bookings

---

### 5.5 List Rooms

`GET /rooms`

**Filters**

* hotel_id
* room_type_id
* status
* availability date range

---

## ➕ Add-ons & Activities

### 6.1 Create Hotel Add-on

`POST /hotel-addons`

**Permission**

* `ADDON_CREATE`

---

### 6.2 Create Activity Add-on

`POST /activity-addons`

---

### 6.3 List Add-ons

`GET /addons`

**Filters**

* hotel_id
* room_type_id
* is_active

---

## 📈 Pricing Rules

### 7.1 Dynamic / Seasonal Pricing

`POST /pricing/dynamic`

**Rules**

* No overlapping date ranges per entity
* priority supported (v1 = 0)

---

### 7.2 Age-Based Pricing

`POST /pricing/age-based`

---

### 7.3 Tax Rules

`POST /pricing/tax`

**Rules**

* Taxes applied after discounts
* Additive

---

### 7.4 List Pricing

`GET /pricing`

---

## 🎟 Coupons

### 8.1 Create Coupon

`POST /coupons`

**Rules**

* Code normalized (uppercase)
* discount before tax
* usage_limit enforced

---

### 8.2 Apply Coupon (Validation Only)

`POST /coupons/validate`

* Used during booking preview

---

### 8.3 List Coupons

`GET /coupons`

---

## 📅 Availability & Search

### 9.1 Search Availability

`GET /availability/search`

**Inputs**

* hotel_id
* check_in
* check_out
* guests

**Logic**

* Uses RoomAvailability
* Read-only
* No locks

---

## 📘 Bookings

### 10.1 Create Booking

`POST /bookings`

**Idempotent**

* Requires `Idempotency-Key`

**Transaction Flow**

1. Lock RoomAvailability rows
2. Validate capacity
3. Resolve pricing:

   * Base
   * Dynamic
   * Age-based
   * Coupon
   * Tax
4. Persist booking + availability
5. Create BookingCoupon (if applied)

---

### 10.2 Update Booking

`PUT /bookings/{id}`

**Rules**

* Allowed only if status ∈ {Pending, Confirmed}
* Triggers full price recalculation

---

### 10.3 Cancel Booking

`POST /bookings/{id}/cancel`

**v1 Behavior**

* Refund amount entered manually
* Future: CancellationPolicy auto-calculation

---

### 10.4 Get Booking

`GET /bookings/{id}`

* Includes:

  * Add-ons
  * Payments
  * Refunds
  * Price breakdown

---

### 10.5 List Bookings

`GET /bookings`

**Filters**

* hotel_id
* date range
* status
* booked_by

---

## 💳 Payments & Refunds

### 11.1 Create Payment

`POST /payments`

**Idempotent**

**Rules**

* Amount > 0
* Updates booking.payment_status

---

### 11.2 Refund Payment

`POST /refunds`

**Rules**

* Partial refunds allowed
* Cannot exceed refundable balance

---

### 11.3 List Payments / Refunds

`GET /payments`
`GET /refunds`

---

## 💰 Transactions (Ledger)

### 12.1 List Transactions

`GET /transactions`

**Filters**

* booking_id
* date range
* type

---

## 🔔 Notifications

### 13.1 List Notifications

`GET /notifications`

---

## 📜 Audit Logs

### 14.1 List Audit Logs

`GET /audit-logs`

**Admin Only**

---

## ✅ Cross-Cutting Rules (Applies to ALL APIs)

* JWT auth mandatory (except login/search)
* Permission checks on every write API
* Idempotency for critical writes
* All writes wrapped in DB transactions
* Audit logs are immutable
* Soft deletes preferred
* Errors are safe and non-leaky

---