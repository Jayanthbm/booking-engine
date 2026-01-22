# Booking Engine – High-Level Overview

Backend system for hotel or resort room bookings
Allows users to search room availability based on selected dates, view pricing, book rooms, select add-ons, and handle payments. Supports dynamic pricing, seasonal pricing, age-based pricing, promotions, taxes, and advanced booking rules.

## Technology Stack

    1. Backend developed using Node.js (JavaScript)
    2. Express used as the web server framework
    3. Prisma ORM used for database access and schema migrations
    4. PostgreSQL used as the relational database

## Entities:

### Entity: Permission

- Purpose / Role
  - Represents a specific action that can be performed in the system
  - Fine-grained control over what a user can or cannot do

- Attributes
  - id → unique identifier
  - name → unique permission name (e.g., ADD_HOTEL, EDIT_HOTEL)
  - description → optional description of what the permission allows
  - created_at, updated_at → timestamps

- Example Permissions
  - ADD_USER, EDIT_USER, DELETE_USER, VIEW_USER
  - ADD_HOTEL, EDIT_HOTEL, DELETE_HOTEL, VIEW_HOTEL
  - ADD_ROOM_TYPE, EDIT_ROOM_TYPE, DELETE_ROOM_TYPE
  - ADD_ROOM, EDIT_ROOM, DELETE_ROOM
  - CREATE_BOOKING, EDIT_BOOKING, CANCEL_BOOKING, DELETE_BOOKING
  - ADD_ADDON, EDIT_ADDON, DELETE_ADDON
  - PROCESS_PAYMENT, REFUND_PAYMENT, VIEW_TRANSACTIONS

- Functionalities / Behaviors
  - Create, update, delete permissions (by SUPERADMIN)
  - Assign permissions to roles

- Constraints / Rules
  - name should be unique
  - Cannot delete if assigned to a role

### Entity: Role

- Purpose / Role
  - Groups a set of permissions into a role for users
  - Allows easy assignment of permissions

- Attributes
  - id → unique identifier
  - name → role name (e.g., SUPERADMIN, ADMIN, RECEPTIONIST)
  - description → optional description
  - created_at, updated_at → timestamps

- Relationships / Join Tables
  - RolePermission: role_id, permission_id

- Functionalities / Behaviors
  - Create, update, delete roles (SUPERADMIN)
  - Assign/remove permissions

- Default Roles
  - SUPERADMIN → full access, all permissions
  - ADMIN → access to hotels, rooms, add-ons, bookings
  - RECEPTIONIST → limited to bookings and guest management

### Entity: User

- Purpose / Role
  - Represents a system user (admin, receptionist, or staff)
  - Used for login, auditing, and action permissions

- Attributes
  - id → unique identifier
  - username → unique login name
  - password → hashed and salted
  - email → unique email address
  - mobile → optional mobile number
  - role_id → reference to the user's role
  - created_at, updated_at → timestamps

- Functionalities / Behaviors
  - Login, 2FA, password reset
  - Create, update, or delete users (by SUPERADMIN)
  - Perform actions based on role permissions
  - Track who performed actions on entities

- Constraints / Rules
  - username should be unique
  - Users cannot delete themselves
  - Every action in system should be auditable to user_id

### Entity: Hotel / Resort

- Purpose / Role
  - Represents the property (hotel or resort) where rooms are located
  - Can store basic details like name, location, contact info
  - Acts as a parent for Rooms, Room Types, Pricing, and Bookings

- Attributes
  - id → unique identifier
  - name → hotel or resort name
  - address → street, city, state, country
  - description → optional text about the property
  - contact_email / contact_phone → for guest/admin communication
  - images → optional gallery URLs
  - created_at, updated_at → timestamps
  - created_by_user_id → references User who created it
  - updated_by_user_id → references User who last updated it

- Functionalities / Behaviors
  - Create, update, or delete a hotel
  - Retrieve hotel details (for admin or API)
  - Associate Rooms, Room Types, and Pricing with the hotel

- Constraints / Rules
  - Hotel name should be unique
  - address should be complete for booking display
  - Cannot delete a hotel if rooms or bookings exist (referential integrity)

### Entity: Room Type

- Purpose / Role
  - Represents a category of rooms in the hotel (e.g., Deluxe, Suite, Standard)
  - defines shared characteristics among rooms (like bed type, capacity, amenities)
  - Serves as the basis for pricing, availability, and bookings

- Attributes
  - id → unique identifier
  - hotel_id → reference to the parent hotel/resort
  - name → e.g., Deluxe, Suite
  - description → optional text about features of this room type
  - max_adults → maximum number of adults allowed in one room
  - max_children → maximum number of children allowed in one room
  - bed_type → single, double, king, queen, etc.
  - amenities → list/JSON of amenities (Wi-Fi, AC, TV, etc.)
  - created_at, updated_at → timestamps
  - created_by_user_id → references User who created it
  - updated_by_user_id → references User who last updated it

- Functionalities / Behaviors
  - Create, update, or delete a room type
  - Retrieve room type details (for admin or API)
  - Enforce booking limits for adults and children
  - Associate rooms under this type
  - Assign default pricing or seasonal pricing rules

- Constraints / Rules
  - Room type name should be unique within a hotel
  - Capacity must be >0
  - Cannot delete a room type if rooms or bookings exist under it
  - Bookings must not exceed max_adults or max_children per room

### Entity: Room

- Purpose / Role
  - Represents an individual room within a hotel or resort
  - Tied to a Room Type, which defines its capacity, bed type, and amenities
  - Tracks availability, status, and bookings for each individual room

- Attributes
  - id → unique identifier
  - hotel_id → reference to the parent hotel/resort
  - room_type_id → reference to the room type
  - room_number → the physical room number or code
  - floor → optional floor number for reference
  - status → e.g., Available, Maintenance, Out of Service
  - created_at, updated_at → timestamps
  - created_by_user_id → references User who created it
  - updated_by_user_id → references User who last updated it

- Functionalities / Behaviors
  - Create, update, or delete a room
  - Assign room to a Room Type
  - Track room availability and maintenance status
  - Retrieve room details during search and booking
  - Enforce room limits based on associated Room Type (max adults/children)

- Constraints / Rules
  - Room number should be unique within a hotel
  - Room cannot be deleted if it has active bookings
  - Status must reflect availability accurately for search and booking

### Entity: Hotel Add-on

- Purpose / Role
  - Optional extras tied to the hotel or specific room types
  - Examples: Breakfast, Extra Bed, Spa, Late Checkout
  - Can have base price and seasonal/date-specific pricing

- Attributes
  - id → unique identifier
  - hotel_id → reference to the parent hotel/resort
  - room_type_id → reference to the room type; can be null (NULL = applies to all rooms)
  - name → Name of the add-on
  - description → Optional text about the add-on
  - base_price → Base price for the add-on
  - per_guest -> True if price is per guest, false if per booking
  - created_at, updated_at → timestamps
  - images → optional gallery URLs
  - created_by_user_id → references User who created it
  - updated_by_user_id → references User who last updated it

- Functionalities / Behaviors
  - Create, update, delete hotel add-ons
  - Associate with room types if needed
  - Display valid add-ons for room selection during booking
  - Price can be overridden by AddOnPricing table for seasonal/date-specific pricing

- Constraints / Rules
  - name should be unique per hotel
  - Base price ≥ 0
  - Cannot delete if associated with bookings

### Entity: Activity / Experience Add-on

- Purpose / Role
  - Optional experiences or services not tied directly to hotel rooms
  - Examples: Jungle Safari, Visit to Nearby Falls, City Tour
  - Can have base price and seasonal pricing
  - Optional association to a hotel/resort if the activity is property-specific

- Attributes
  - id → unique identifier
  - name → Name of the add-on
  - description → Optional text about the add-on
  - base_price → Base price for the add-on
  - per_guest -> True if price is per guest, false if per booking
  - hotel_id → Optional reference to hotel/resort
  - created_at, updated_at → timestamps
  - images → optional gallery URLs
  - created_by_user_id → references User who created it
  - updated_by_user_id → references User who last updated it

- Functionalities / Behaviors
  - Create, update, delete activities
  - Associate with bookings
  - Price can have seasonal or date-specific overrides via AddOnPricing table

- Constraints / Rules
  - name should be unique
  - Base price ≥ 0
  - Cannot delete if linked to active bookings

### Entity: Dynamic / Seasonal Pricing

- Purpose / Role
  - Handles seasonal or date-specific pricing for Room Types, Hotel Add-ons, or Activity/Experience Add-ons
  - Examples: Holiday rate for Extra Bed, peak-season Jungle Safari tickets, weekend room rates
  - Ensures non-ambiguous pricing by preventing overlapping date ranges

- Attributes
  - id → unique identifier
  - entity_type → Enum: RoomType, HotelAddOn, ActivityAddOn
  - entity_id → reference to the specific add-on or room type
  - start_date → start date for the seasonal pricing
  - end_date → end date for the seasonal pricing
  - price → price for this period
  - notes → optional description or reason for this dynamic pricing
  - created_at, updated_at → timestamps
  - created_by_user_id → references User who created it
  - updated_by_user_id → references User who last updated it

- Functionalities / Behaviors
  - Create, update, delete seasonal/dynamic pricing for rooms or add-ons
  - Retrieve price for a specific date range during booking
  - Enforce non-overlapping date ranges to avoid ambiguity
  - Automatically override the base price for the entity during applicable dates

- Constraints / Rules
  - price ≥ 0
  - start_date < end_date
  - Date ranges for the same entity must not overlap
  - Cannot delete if linked to active bookings

### Entity: Coupon

- Purpose / Role
  - Represents a discount code that can be applied to bookings.

- Attributes
  - id → unique identifier
  - code → unique coupon code (e.g., “NEWYEAR50”)
  - description → optional description of the promotion
  - discount_percentage → discount to apply (0–100)
  - start_date → start date for the coupon
  - end_date → end date for the coupon
  - minimum_spend → minimum spend required to apply the coupon
  - is_active → True if the coupon is currently active
  - usage_limit → max number of times coupon can be used; -1 = unlimited
  - created_at, updated_at → timestamps
  - created_by_user_id → references User who created it

- Functionalities / Behaviors
  - Create, update, delete coupons
  - Validate coupon for bookings (active date, usage limit)
  - Apply discount to total booking price

- Constraints / Rules
  - code should be unique
  - discount_percentage should be between 0 and 100
  - start_date < end_date
  - Cannot delete coupon if already used in bookings
  - minimum_spend should be positive

### Entity: BookingCoupon (join table)

- Purpose / Role
  - Tracks which bookings have used which coupons.

- Attributes
  - id → unique identifier
  - booking_id → reference to the booking
  - coupon_id → reference to the coupon
  - discount_amount → actual discount applied in this booking
  - created_at, updated_at → timestamps

- Functionalities / Behaviors
  - Record coupon usage per booking
  - Enforce coupon usage limits

- Constraints / Rules
  - A coupon cannot be used more than its usage_limit (unless -1)

### Entity: Booking

- Purpose / Role
  - Represents a reservation made by a guest for a hotel/resort. Tracks rooms, add-ons, guest details, payments, discounts, and invoice.

- Attributes
  - id → unique identifier
  - hotel_id → reference to the hotel/resort
  - room_type_id → reference to the room type
  - room_id → reference to the room
  - check_in_date → booking start date
  - check_out_date → booking end date
  - num_adults → number of adults
  - num_children → number of children
  - guest_name → name of the guest
  - guest_email → optional email for notifications
  - guest_phone → contact number
  - booked_by → Enum: Guest, Receptionist
  - base_room_price → room base price (before dynamic pricing)
  - total_room_price → final room price after seasonal/dynamic pricing
  - hotel_addons_total → total cost of selected hotel add-ons
  - activity_addons_total → total cost of selected activity/experience add-ons
  - total_discount → total discount applied (including coupon or promotions)
  - total_price → final price after discount
  - coupon_code → optional applied coupon code
  - invoice → reference to invoice number or file
  - payment_mode → Enum: Cash, Card, UPI, Other
  - payment_status → Enum: Pending, Advance Paid, Fully Paid, Refunded
  - status → Enum: Pending, Confirmed, Cancelled, Completed
  - created_at, updated_at → timestamps
  - created_by_user_id → references User who created it can be null
  - updated_by_user_id → references User who last updated it can be null

- Relationships / Join Tables
  - BookingHotelAddOn → booking to hotel add-ons
  - BookingActivityAddOn → booking to activity add-ons
  - BookingCoupon → booking to coupon(s)

- Functionalities / Behaviors
  - Create/update/cancel bookings
  - Apply dynamic, age-based, seasonal pricing
  - Apply taxes, discounts, promotions, and coupons
  - Validate room capacity
  - Handle waitlists and overbooking
  - Generate invoice and track coupon usage
  - Track notifications

- Constraints / Rules
  - check_in_date < check_out_date
  - num_adults ≤ room type max adults
  - num_children ≤ room type max children
  - cannot delete or update if booking status is Completed
  - Add-ons and dynamic pricing must be valid for the booking dates

### Entity: Payment

- Purpose / Role
  - Tracks payments made for bookings

- Attributes
  - id → unique identifier
  - booking_id → reference to the booking
  - amount → payment amount
  - payment_date → date/time of payment
  - payment_mode → Enum: Cash, Card, UPI, Other
  - payment_status → Enum: Pending, Completed, Failed
  - transaction_id → optional transaction reference from payment gateway
  - created_at, updated_at → timestamps

- Functionalities / Behaviors
  - Record payments, track status, validate payment success
  - Integrate with payment gateways

- Constraints / Rules
  - Payment amount > 0
  - Cannot delete payments linked to active bookings

### Entity: Refund

- Purpose / Role
  - Tracks refunds for bookings or payments

- Attributes
  - id → unique identifier
  - payment_id → reference to the payment
  - amount → refund amount
  - refund_date → date/time of refund
  - status → Enum: Pending, Completed, Failed
  - reason → optional explanation for refund
  - created_at, updated_at → timestamps

- Functionalities / Behaviors
  - Initiate refunds for cancelled bookings or errors
  - Track refund processing status

- Constraints / Rules
  - amount ≤ original payment amount
  - Cannot delete refund once completed

### Entity: Transaction

- Purpose / Role
  - Records all financial transactions, including payments, refunds, and adjustments
  - Useful for audit and reporting

- Attributes
  - id → unique identifier
  - booking_id → optional reference
  - payment_id → optional reference
  - refund_id → optional reference
  - amount → positive or negative
  - transaction_type → Enum: Payment, Refund, Adjustment
  - transaction_date → date/time of transaction
  - created_at, updated_at → timestamps

- Functionalities / Behaviors
  - Track all money movement for accountability

- Constraints / Rules
  - Amount must match linked payment/refund if applicable

### Entity: Age-Based / Child Pricing

- Purpose / Role
  - Defines price adjustments based on age for Room Types, Hotel Add-ons, or Activity/Experience Add-ons
  - Example:
    - Room: 0–1 year free, 2–5 years 50% price
    - Breakfast add-on: 0–1 year free, 2–5 years 20%

- Attributes
  - id → unique identifier
  - entity_type → Enum: RoomType, HotelAddOn, ActivityAddOn
  - entity_id → reference to the specific room type or add-on
  - age → age in years for which this pricing applies
  - price_factor → multiplier (0 = free, 0.2 = 20%, etc.)
  - notes → optional description or reason for this age-based pricing
  - created_at, updated_at → timestamps
  - created_by_user_id, updated_by_user_id → references User

- Functionalities / Behaviors
  - Apply age-based price factor to room or add-on during booking
  - Lookup based on child’s age (highest age ≤ child’s age)
  - Works for both rooms and add-ons

- Constraints / Rules
  - age ≥ 0
  - price_factor ≥ 0 and ≤ 1
  - Only one rule per age per entity
  - Cannot delete if linked to active bookings
