---
# Booking Engine – API List & Core Logic
---

## 1️⃣ Users

### 1.1 Login

- Validate username and password.
- Issue JWT token with role info.
- Track login timestamp for auditing.
- Handle failed login attempts (lockout if necessary).

### 1.2 Create User

- Validate uniqueness of `username` and `email`.
- Assign role to user (only SUPERADMIN can assign roles).
- Hash and salt password.
- Track `created_by_user_id`.

### 1.3 Update User

- Only SUPERADMIN can update roles.
- Users cannot delete or modify themselves.
- Track `updated_by_user_id`.

### 1.4 Delete User

- Prevent deletion of self.
- Prevent deletion if user created critical entities (hotels, room types, etc. – optional based on business logic).

### 1.5 List Users

- Pagination, filtering by role.
- Show associated role and permissions.

---

## 2️⃣ Roles & Permissions

### 2.1 Create Role

- Only SUPERADMIN.
- Assign multiple permissions at creation.

### 2.2 Update Role

- Modify role name or assigned permissions.
- Cannot delete if assigned to active users.

### 2.3 Delete Role

- Only if no users are assigned.
- Prevent deletion of default roles (SUPERADMIN, ADMIN, RECEPTIONIST).

### 2.4 List Roles

- Include permissions associated.

### 2.5 Assign/Remove Permissions to Role

- Update RolePermission mapping.
- Only SUPERADMIN can manage.

---

## 3️⃣ Hotels

### 3.1 Create Hotel

- Validate unique hotel name.
- Track `created_by_user_id`.
- Optional: validate address completeness.

### 3.2 Update Hotel

- Update details including contact info and images.
- Track `updated_by_user_id`.

### 3.3 Delete Hotel

- Prevent deletion if rooms or bookings exist.

### 3.4 List Hotels

- Support filters: location, name, availability.
- Pagination.

### 3.5 Get Hotel Details

- Include rooms, room types, add-ons, and dynamic pricing.

---

## 4️⃣ Room Types & Rooms

### 4.1 Create Room Type

- Validate unique name per hotel.
- Must have `max_adults` > 0.
- Track creator and timestamps.

### 4.2 Update Room Type

- Cannot exceed capacities of rooms/active bookings.
- Track updater.

### 4.3 Delete Room Type

- Prevent deletion if rooms or bookings exist.

### 4.4 List Room Types

- Include associated rooms and pricing.

### 4.5 Create Room

- Room number unique per hotel.
- Associate with a Room Type.
- Track creator.

### 4.6 Update Room

- Update status (Available, Maintenance, Out of Service).
- Prevent updates that break capacity rules.

### 4.7 Delete Room

- Cannot delete if active bookings exist.

### 4.8 List Rooms

- Filter by hotel, room type, status.
- Include availability info.

---

## 5️⃣ Add-ons

### 5.1 Create Hotel Add-on

- Name unique per hotel.
- Base price ≥ 0.
- Optional association to room types.
- Track creator.

### 5.2 Update Hotel Add-on

- Prevent breaking rules for active bookings.

### 5.3 Delete Hotel Add-on

- Prevent deletion if linked to active bookings.

### 5.4 List Hotel Add-ons

- Filter by hotel or room type.

### 5.5 Create Activity Add-on

- Name unique.
- Base price ≥ 0.
- Optional hotel association.
- Track creator.

### 5.6 Update/Delete/List Activity Add-ons

- Same constraints as hotel add-ons.

---

## 6️⃣ Dynamic / Seasonal Pricing

### 6.1 Create / Update / Delete Pricing

- Entities: RoomType, HotelAddOn, ActivityAddOn.
- Ensure non-overlapping date ranges per entity.
- Price ≥ 0.
- Cannot delete if linked to active bookings.

### 6.2 List Pricing

- Filter by entity type, date range.

---

## 7️⃣ Age-Based / Child Pricing

### 7.1 Create / Update / Delete Age Pricing

- Validate age ≥ 0.
- Price factor between 0–1.
- One rule per age per entity.
- Cannot delete if linked to active bookings.

### 7.2 List Age Pricing

- Filter by entity type, entity_id.

---

## 8️⃣ Coupons

### 8.1 Create Coupon

- Unique code.
- Validate discount percentage 0–100.
- Validate start/end dates.
- Usage limit ≥ -1 (-1 = unlimited).
- Track creator.

### 8.2 Update / Delete Coupon

- Cannot delete if already used in bookings.
- Update only allowed if usage hasn’t exceeded limit.

### 8.3 List Coupons

- Filter by active/inactive, date range.

### 8.4 Apply Coupon to Booking

- Validate coupon is active and within usage limit.
- Apply discount to booking’s `total_discount`.
- Track usage in `BookingCoupon` table.

---

## 9️⃣ Bookings

### 9.1 Create Booking

- Validate:
  - Room availability.
  - Max adults/children per room type.
  - Add-ons and dynamic pricing for booking dates.
  - Coupon validity if applied.

- Calculate:
  - Base room price, dynamic pricing adjustments.
  - Add-ons total.
  - Age-based discounts.
  - Total price and total discount.

- Track:
  - Booking creator (Guest / Receptionist)
  - Coupon usage if applied.
  - Invoice number.

### 9.2 Update Booking

- Partial updates allowed.
- Cannot update Completed bookings.
- Recalculate prices if any change affects totals (dates, room, add-ons, coupon).

### 9.3 Cancel Booking

- Update status to Cancelled.
- Trigger refund if payment exists.

### 9.4 List / Get Booking

- Filters: hotel, date range, status, booked_by.
- Include associated add-ons, coupon, and payment info.

---

## 🔟 Payments

### 10.1 Create Payment

- Validate amount > 0.
- Track payment status (Pending / Completed / Failed).
- Associate with booking.
- Integrate with payment gateway.

### 10.2 Refund Payment

- Validate amount ≤ original payment.
- Track refund status.
- Update booking payment status if necessary.

### 10.3 List Payments

- Filters: booking_id, date range, status.

---

## 1️⃣1️⃣ Transactions

### 11.1 List Transactions

- Track all payments, refunds, adjustments.
- Filter by booking, payment, or refund.
- Include amount, type, and date.

---

## ✅ Notes / Core Logic Across All APIs

- JWT authentication and role-based authorization required.
- Audit logs: track `created_by_user_id` and `updated_by_user_id`.
- Pagination and filtering for all list endpoints.
- Validation at every step for capacity, availability, dates, coupon limits, and price rules.
- Referential integrity enforced at DB level (cannot delete referenced entities).
