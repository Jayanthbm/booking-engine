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
  - Represents a single atomic action that can be performed in the system
  - Enables fine-grained authorization independent of roles

- Attributes
  - id → unique identifier
  - name → unique, immutable permission name
      - Format: RESOURCE_ACTION (e.g., HOTEL_CREATE, BOOKING_CANCEL)
  - description → optional human-readable description
  - created_at, updated_at → timestamps
  - is_system → boolean
      - Marks core permissions that cannot be modified or deleted

- Example Permissions
  - USER_CREATE, USER_EDIT, USER_DELETE, USER_VIEW
  - HOTEL_CREATE, HOTEL_EDIT, HOTEL_DELETE, HOTEL_VIEW
  - ROOM_TYPE_CREATE, ROOM_TYPE_EDIT, ROOM_TYPE_DELETE
  - ROOM_CREATE, ROOM_EDIT, ROOM_DELETE
  - BOOKING_CREATE, BOOKING_EDIT, BOOKING_CANCEL
  - ADDON_CREATE, ADDON_EDIT, ADDON_DELETE
  - PAYMENT_PROCESS, PAYMENT_REFUND, TRANSACTION_VIEW

- Functionalities / Behaviors
  - Create, update, delete permissions (SUPERADMIN only)
  - Assign permissions to roles via RolePermission mapping
  - Permissions are not assigned directly to users
  - All authorization checks resolve through roles

- Constraints / Rules
  - name must be globally unique
  - Permission cannot be deleted if:
      - Assigned to any role
      - Marked as is_system = true
  - Permission names should be treated as immutable once in use

### Entity: Role

- Purpose / Role
  - Groups a set of permissions into a role
  - Simplifies permission assignment and authorization checks

- Attributes
  - id → unique identifier
  - name → unique, immutable role name
      - Examples: SUPERADMIN, ADMIN, RECEPTIONIST
  - description → optional description
  - is_active → boolean
      - Determines whether the role can be assigned or used
  - created_at, updated_at → timestamps

- Relationships / Join Tables
  - RolePermission
      - role_id
      - permission_id

- Functionalities / Behaviors
  - Create, update, delete roles (SUPERADMIN only)
  - Assign / remove permissions from roles
  - Activate / deactivate roles (is_active)
  - Users with inactive roles:
      - Authentication is denied at login
      - Tokens are not issued

- Default Roles
  - SUPERADMIN
      - full access
      - Cannot be deactivated or deleted
  - ADMIN
      - Manage hotels, rooms, add-ons, bookings
  - RECEPTIONIST
      - Limited to bookings and guest handling

- Constraints / Rules
  - Default roles are system roles
  - Cannot be deleted
  - Permissions can be modified only with caution
  - name must be unique
  - Role cannot be deleted if:
      - Assigned to any user
      - Marked as system/default role
  - SUPERADMIN role:
      - Cannot be renamed
      - Cannot be deactivated

### Entity: User

- Purpose / Role
  - Represents a system user (admin, receptionist, or staff)
  - Used for authentication, authorization, auditing, and operational actions

- Attributes
  - id → unique identifier
  - username → unique, immutable login name
  - password → hashed & salted (never stored in plain text)
  - email → unique email address
  - mobile → optional, unique mobile number
  - role_id → reference to assigned Role
  - is_active → boolean
  - last_login_at → timestamp (nullable)
  - failed_login_attempts → integer (default 0)
  - locked_until → timestamp (nullable)
  - created_at, updated_at → timestamps
  - created_by_user_id → references User
  - updated_by_user_id → references User

- Functionalities / Behaviors
  - Login with password verification
  - Optional 2FA for privileged users
  - Password reset (token-based, time-limited)
  - Create, update, activate/deactivate users (SUPERADMIN only)
  - Perform actions based on role permissions
  - All user actions are auditable

- Constraints / Rules
  - username should be unique
  - email must be unique
  - mobile and email combined should be unique
  - Users cannot delete themselves
  - Inactive users cannot log in
  - Users assigned to inactive roles cannot log in
  - Password resets invalidate existing sessions
  - Every privileged action is auditable to user_id

### Entity: Hotel / Resort

- Purpose / Role
  - Represents the property (hotel or resort) where rooms are located
  - Stores core property details used for booking, pricing, and communication
  - Acts as the parent for Rooms, Room Types, Pricing, Policies, and Bookings

- Attributes
  - id → unique identifier
  - name → unique, immutable hotel or resort name
  - address → street, city, state, country
  - description → optional text about the property
  - contact_email → primary contact email
  - contact_phone → primary contact phone
  - timezone → string
  - check_in_time → time (e.g., 14:00)
  - check_out_time → time (e.g., 11:00)
  - currency → ISO currency code (e.g., INR, USD)
  - images → optional gallery URL
  - is_active → boolean
  - created_at, updated_at → timestamps
  - created_by_user_id → references User
  - updated_by_user_id → references User

- Functionalities / Behaviors
  - Create, update, activate/deactivate a hotel
  - Retrieve hotel details (admin & public APIs)
  - Associate rooms, room types, pricing rules, taxes, and policies
  - Prevent new bookings if hotel is inactive

- Constraints / Rules
  - name must be unique
  - Address must be complete for booking display
  - Inactive hotels:
      - Cannot accept new bookings
      - Existing bookings remain unaffected
  - Hotel cannot be deleted if:
      - Rooms exist
      - Bookings exist
  - Prefer soft delete over hard delete

### Entity: Room Type

- Purpose / Role
  - Represents a category of rooms within a hotel (e.g., Deluxe, Suite, Standard)
  - Defines shared characteristics such as capacity, bed type, and amenities
  - Serves as the primary unit for pricing, availability, and booking rules

- Attributes
  - id → unique identifier
  - hotel_id → reference to parent Hotel / Resort
  - name → room type name (unique within hotel)
  - description → optional description
  - max_adults → maximum number of adults per room
  - max_children → maximum number of children per room
  - base_price → numeric
  - bed_type → single, double, king, queen, etc.
  - amenities → list / JSON of amenities (Wi-Fi, AC, TV, etc.)
  - is_active → boolean
  - created_at, updated_at → timestamps
  - created_by_user_id → references User who created it
  - updated_by_user_id → references User who last updated it

- Functionalities / Behaviors
  - Create, update, activate/deactivate room types
  - Retrieve room type details (admin & public APIs)
  - Enforce adult & child capacity limits during booking
  - Associate rooms under this type
  - Apply pricing via Pricing Engine (base + seasonal + age-based)

- Constraints / Rules
  - (hotel_id, name) must be unique
  - max_adults + max_children > 0
  - base_price ≥ 0
  - Inactive room types:
      - Cannot accept new bookings
      - Existing bookings remain valid
  - Room type cannot be deleted if:
      - Rooms exist
      - Bookings exist
  - Prefer soft delete over hard delete

### Entity: Room

- Purpose / Role
  - Represents an individual physical room within a hotel or resort
  - Inherits capacity, bed type, and amenities from its Room Type
  - Acts as the atomic unit of availability for bookings

- Attributes
  - id → unique identifier
  - hotel_id → reference to parent Hotel / Resort
  - room_type_id → reference to Room Type
  - room_number → physical room number or code
  - floor → optional floor reference
  - status → enum
        - Available
        - Maintenance
        - Out of Service
  - is_active → boolean
  - notes → optional text
  - created_at, updated_at → timestamps
  - created_by_user_id → references User who created it
  - updated_by_user_id → references User who last updated it

- Functionalities / Behaviors
  - Create, update, activate/deactivate rooms
  - Assign room to a Room Type
  - Mark room as unavailable via status or availability calendar
  - Retrieve room details for admin and booking flows
  - Enforce capacity limits via associated Room Type

- Constraints / Rules
  - (hotel_id, room_number) must be unique
  - Room cannot be deleted if:
      - Any booking exists (past or future)
  - If status ≠ Available:
      - RoomAvailability records must not allow booking
  - Inactive rooms:
      - Cannot accept new bookings
      - Existing bookings remain unaffected
  - Prefer soft delete over hard delete

### Entity: Hotel Add-on

- Purpose / Role
  - Represents optional services or extras provided by a hotel
  - Can apply globally to all room types or be restricted to specific room types
  - Participates in pricing, discounts, taxes, and bookings

- Attributes
  - id → unique identifier
  - hotel_id → reference to parent Hotel / Resort
  - room_type_id → reference to Room Type (nullable)
      - NULL ⇒ applies to all room types
  - name → add-on name (unique per hotel)
  - description → optional description
  - base_price → numeric
  - per_guest → boolean
      - true ⇒ price × number of guests
      - false ⇒ price × booking
  - is_active → boolean
  - max_quantity → integer (nullable)
     - Limits how many times the add-on can be selected per booking
  - images → optional gallery URLs
  - created_at, updated_at → timestamps
  - created_by_user_id → references User
  - updated_by_user_id → references User

- Functionalities / Behaviors
  - Create, update, activate/deactivate hotel add-ons
  - Associate add-ons with room types (optional)
  - Show only valid, active add-ons during booking
  - Pricing resolved via Pricing Engine:
      - Base price
      - Seasonal / dynamic pricing
      - Age-based pricing (if applicable)

- Constraints / Rules
  - (hotel_id, name) must be unique
  - base_price ≥ 0
  - max_quantity > 0 (if specified)
  - Inactive add-ons:
      - Cannot be selected for new bookings
      - Existing bookings remain unaffected
  - Add-on cannot be deleted if:
      - Linked to any booking
  - Prefer soft delete over hard delete

### Entity: Activity / Experience Add-on

- Purpose / Role
  - Represents optional experiences or services not directly tied to hotel rooms
  - Can be hotel-specific or global (usable across hotels)
  - Participates in pricing, discounts, taxes, and bookings

- Attributes
  - id → unique identifier
  - name → activity name
  - description → optional description
  - base_price → numeric
  - per_guest → boolean
      - true ⇒ price × number of guests
      - false ⇒ price × booking
  - hotel_id → optional reference to Hotel / Resort
        - NULL ⇒ global activity
  - is_active → boolean
        - Controls whether activity is selectable for new bookings
  - max_quantity → integer (nullable)
     - Limits how many times the activity can be selected per booking
  - images → optional gallery URLs
  - created_at, updated_at → timestamps
  - created_by_user_id → references User
  - updated_by_user_id → references User

- Functionalities / Behaviors
  - Create, update, activate/deactivate activities
  - Associate activities with bookings
  - Display only valid, active activities during booking
  - Pricing resolved via Pricing Engine:
      - Base price
      - Seasonal / dynamic pricing
      - Age-based pricing (if applicable)

- Constraints / Rules
  - name must be unique per scope:
      - Global activities: unique globally
      - Hotel-specific activities: unique per hotel
  - base_price ≥ 0
  - max_quantity > 0 (if specified)
  - Inactive activities:
      - Cannot be selected for new bookings
      - Existing bookings remain unaffected
  - Activity cannot be deleted if:
      - Linked to any booking
  - Prefer soft delete over hard delete

### Entity: Dynamic / Seasonal Pricing

- Purpose / Role
  - Defines date-specific price overrides for:
      - Rooms or Add-ons
      - Hotel Add-ons
      - Activity / Experience Add-ons
  - Ensures deterministic pricing by enforcing non-overlapping date ranges
  - Acts as a pure pricing rule, not a transactional record

- Attributes
  - id → unique identifier
  - entity_type → Enum
      - RoomType
      - HotelAddOn
      - ActivityAddOn
  - entity_id → reference to target entity
  - start_date → start date (inclusive)
  - end_date → end date (exclusive)
      - Prevents off-by-one errors
  - price → numeric
      - Overrides base price for this period
  - priority → integer
      - Resolves conflicts if multiple rules technically apply
  - is_active → boolean
      - Allows temporary disabling without deletion
  - notes → optional explanation
  - created_at, updated_at → timestamps
  - created_by_user_id → references User
  - updated_by_user_id → references User

- Functionalities / Behaviors
  - Create, update, activate/deactivate pricing rules
  - Pricing Engine selects highest-priority active rule for given date
  - Applies price override during booking price calculation
  - Supports future seasonal pricing without impacting existing bookings

- Constraints / Rules
  - price ≥ 0
  - start_date < end_date
  - For same (entity_type, entity_id):
      - Active date ranges must not overlap
  - Inactive pricing rules are ignored
  - Pricing rule cannot be deleted if:
      - Used by any existing booking price breakdown
  - Prefer soft delete over hard delete

### Entity: Age-Based / Child Pricing

- Purpose / Role
  - Defines price adjustments based on guest age for:
      - Room Types
      - Hotel Add-ons
      - Activity / Experience Add-ons
  - Enables child-specific discounts or free pricing
  - Acts as a pricing rule, not a transactional record

- Attributes
  - id → unique identifier
  - entity_type → Enum
        - RoomType
        - HotelAddOn
        - ActivityAddOn
  - entity_id → reference to target entity
  - age → integer (Represents the maximum age this rule applies to)
  - price_factor → numeric
        - 0.0 ⇒ free
        - 0.5 ⇒ 50% of base price
        - 1.0 ⇒ no change
  - is_active → boolean
  - notes → optional explanation
  - created_at, updated_at → timestamps
  - created_by_user_id, updated_by_user_id → references User

- Functionalities / Behaviors
  - Pricing Engine selects rule using:
      - Highest age ≤ child’s age
      - Rule must be active
  - Applies price factor to:
      - Room price (if applicable)
      - Add-on price (if applicable)
  - Supports different child pricing across entities

- Constraints / Rules
  - age ≥ 0
  - price_factor ≥ 0 AND ≤ 1
  - For same (entity_type, entity_id):
      - Only one rule per age
  - Inactive rules are ignored
  - Rule cannot be deleted if:
      - Used in any existing booking price breakdown
  - Prefer soft delete over hard delete

### Entity: TaxRule

- Purpose / Role
  - Defines tax rules applicable to bookings, rooms, or add-ons
  - Supports government taxes (GST), service charges, or local/city taxes
  - Ensures taxes are applied deterministically and transparently

- Attributes
  - id → unique identifier
  - hotel_id → reference to Hotel / Resort
  - tax_name → name of the tax
  - tax_type → Enum
      - Percentage
      - Fixed
  - tax_value → numeric
      - Percentage (e.g., 12.0 for 12%)
      - Fixed amount (e.g., 200)
  - applicable_on → enum
      - Room
      - HotelAddOn
      - ActivityAddOn
      - Total
  - start_date → start date (inclusive)
  - end_date → end date (nullable)
      - NULL = tax applies indefinitely
  - is_active → boolean
  - notes → optional description
  - created_at, updated_at → timestamps
  - created_by_user_id → references User
  - updated_by_user_id → references User

- Functionalities / Behaviors

  - Create, update, activate/deactivate tax rules
  - Pricing Engine applies all active tax rules that:
      - Match hotel
      - Match applicability
      - Are valid for booking dates
  - Taxes are calculated:
      - After discounts
      - Before final total is stored
  - Applied tax values are stored in booking price_breakdown

- Constraints / Rules
  - tax_value ≥ 0
  - start_date < end_date (if end_date exists)
  - Multiple tax rules may apply simultaneously
      - Taxes are additive, not exclusive
  - Inactive tax rules are ignored
  - Tax rules cannot be deleted if:
      - Referenced in any booking price breakdown
  - Prefer soft delete over hard delete

### Entity: Coupon

- Purpose / Role
  - Represents a promotional discount that can be applied to a booking
  - Supports percentage-based discounts with clear validity and usage limits

- Attributes
  - id → unique identifier
  - code → unique, immutable coupon code
      - Case-insensitive (stored normalized, e.g., uppercase)
  - description → optional promotion description
  - discount_type → enum
      - Percentage
      - Fixed
  - discount_value → numeric
      - Percentage (0–100)
      - Fixed amount (e.g., 500)
  - max_discount_amount → numeric (nullable)
      - Caps discount for percentage coupons
  - start_date → start date (inclusive)
  - end_date → end date (exclusive)
  - minimum_spend → numeric
  - is_active → boolean
  - usage_limit → integer
      - -1 = unlimited
  - usage_count → integer
  - created_at, updated_at → timestamps
  - created_by_user_id → references User

- Functionalities / Behaviors
  - Create, update, activate/deactivate coupons
  - Validate coupon during booking:
      - Active
      - Within date range
      - Usage limit not exceeded
      - Minimum spend satisfied
  - Pricing Engine applies discount:
      - Before tax calculation
      - Discount stored in price breakdown

- Constraints / Rules
  - code must be unique and immutable
  - discount_value ≥ 0
  - Percentage discount ≤ 100
  - start_date < end_date
  - minimum_spend ≥ 0
  - Coupon cannot be deleted if:
      - Used in any booking
  - Inactive coupons:
      - Cannot be applied to new bookings
  - Prefer soft delete over hard delete

### Entity: RoomAvailability

- Purpose / Role
  - Represents the date-level availability of an individual room
  - Acts as the single source of truth for booking safety
  - Prevents overbooking through transactional database locking

- Attributes
  - id → unique identifier
  - room_id → reference to Room
  - date → calendar date
  - is_booked → boolean
      - true ⇒ room is reserved for this date
  - booking_id → reference to Booking (nullable)
      - Populated only when is_booked = true
  - created_at, updated_at → timestamps

- Functionalities / Behaviors
  - Availability records are created:
      - At booking time (inside DB transaction)
      - Or pre-generated per room per date
  - Booking creation flow:
      1. Start DB transaction
      2. Lock availability rows (SELECT … FOR UPDATE)
      3. Ensure all requested dates are free
      4. Mark rows as booked and link booking_id
      5. Commit transaction
  - Cancellation flow:
      - Marks associated availability rows as free
      - Removes booking_id reference

- Constraints / Rules
  - (room_id, date) must be unique
  - A room cannot be booked if:
      - is_booked = true
      - Room status ≠ Available
      - Room is inactive
  - Availability records are append-safe:
      - Never deleted once used
      - Freed by setting is_booked = false
  - RoomAvailability must not be modified outside a transaction

### Entity: Booking

- Purpose / Role
  - Represents a confirmed or pending reservation made by a guest
  - Acts as the central transactional record linking:
      - Room availability
      - Pricing rules
      - Add-ons
      - Taxes
      - Payments and refunds

- Attributes
  - id → unique identifier
  - hotel_id → reference to Hotel / Resort
  - room_type_id → reference to Room Type
  - room_id → reference to Room

  - check_in_date → start date (inclusive)
  - check_out_date → end date (exclusive)
  - num_adults → number of adults
  - num_children → number of children

  - guest_name → guest name
  - guest_email → optional email
  - guest_phone → contact number

  - booked_by → enum
      - Guest
      - Receptionist
  - status → Enum:
      - Pending
      - Confirmed
      - Cancelled
      -  Completed
    - status_changed_at
    - status_reason

  - base_room_price → base price per night at booking time
  - room_price_total → total room price after dynamic pricing
  - hotel_addons_total → total hotel add-ons price
  - activity_addons_total → total activity add-ons price
  - tax_total → total tax applied
  - total_discount → total discount applied
  - total_price → final price after discount
  - total_price → final payable amount
  - price_breakdown → JSON (Stores full calculation trace)

  - coupon_code → applied coupon code (nullable)
  - invoice_number → generated invoice reference
  - invoice_url → optional invoice file URL

  - payment_status → Enum
      - Pending
      - Partially Paid
      - Fully Paid
      - Refunded

  - created_at, updated_at → timestamps
  - created_by_user_id → references User (nullable for guest)
  - updated_by_user_id → references User

- Relationships / Join Tables
  - BookingHotelAddOn → booking to hotel add-ons
  - BookingActivityAddOn → booking to activity add-ons
  - BookingCoupon → booking to coupon(s)

- Functionalities / Behaviors
  - Create booking inside a DB transaction:
      1. Lock RoomAvailability rows
      2. Validate capacity
      3. Calculate price via Pricing Engine
      4. Persist booking + availability
  - Update booking:
      - Allowed only in Pending or Confirmed
      - Triggers full price recalculation
  - Cancel booking:
      - Updates status
      - Frees RoomAvailability
      - Applies CancellationPolicy
      - Initiates refunds if needed
  - Complete booking:
      - Marks stay finished
      - Becomes immutable

- Constraints / Rules
  - check_in_date < check_out_date
  - num_adults ≤ room_type.max_adults
  - num_children ≤ room_type.max_children
  - Booking cannot be modified if:
      - status = Completed
      - status = Cancelled
  - Booking cannot exist without:
      - Valid RoomAvailability rows
  - Pricing rules, coupons, and taxes must be valid for booking dates
  - Booking cannot be hard-deleted
      - Use status + audit logs

### Entity: BookingCoupon (join table)

- Purpose / Role
  - Records the application of a coupon to a specific booking
  - Acts as the historical source of truth for coupon usage and discount amounts

- Attributes
  - id → unique identifier
  - booking_id → reference to Booking
  - coupon_id → reference to Coupon
  - coupon_code → string
    - Snapshot of the coupon code at booking time
  - discount_amount → numeric
      - Final discount applied to this booking
  - created_at, updated_at → timestamps

- Functionalities / Behaviors
  - Created only once per booking at booking confirmation
  - Used to:
      - Track coupon usage
      - Enforce usage limits
      - Generate reports and audits
  - Coupon application flow:
      1. Validate coupon
      2. Calculate discount via Pricing Engine
      3. Store applied discount in BookingCoupon
      4. Increment coupon usage count

- Constraints / Rules
  - (booking_id, coupon_id) must be unique
  - A booking cannot apply the same coupon more than once
  - Coupon usage must not exceed usage_limit (unless -1)
  - BookingCoupon cannot be deleted or modified once created
      - Coupon history must remain immutable

### Entity: Payment

- Purpose / Role
  - Represents a single monetary attempt or transaction against a booking
  - Tracks how much money was attempted, collected, or failed
  - Serves as the authoritative source for payment mode and gateway interaction


- Attributes
  - id → unique identifier
  - booking_id → reference to Booking

  - amount → numeric
  - payment_mode → enum
      - Cash
      - Card
      - UPI
      - Wallet
      - Bank Transfer
      - Other
   - payment_status → enum
      - Pending
      - Completed
      - Failed
  - payment_date → timestamp
    - Time at which payment was completed (nullable until success)

  - transaction_id → string (nullable)
      - Reference from payment gateway
      - Must be unique per gateway (if present)

  - gateway_name → string
  - gateway_response → JSON

  - created_at, updated_at → timestamps
  - created_by_user_id

- Functionalities / Behaviors
  - A payment record is created when:
    - User initiates a payment attempt
  - Payment lifecycle:
    1. Created with Pending
    2. Updated to Completed or Failed
    3. Never deleted or reused
  - Booking payment_status is derived from:
      - Sum of Completed payments
      - Compared against booking total_price

- Constraints / Rules
  - amount > 0
  - transaction_id must be unique (if present)
  - Payment records are immutable after completion:
    - Amount, mode, and booking_id cannot change
  - Payments cannot be deleted, regardless of booking state
  - Refunds are handled only via Refund entity
    - Never modify Payment amount for refunds

### Entity: Refund

- Purpose / Role
  - Represents a monetary reversal of a completed payment
  - Tracks refund attempts, outcomes, and reasons
  - Works in conjunction with Payment and Transaction for full financial traceability

- Attributes
  - id → unique identifier
  - payment_id → reference to Payment
      - Refunds are always tied to a specific payment

  - amount → numeric (Amount being refunded)
  - status → enum
      - Pending
      - Completed
      - Failed
  - refund_date → timestamp (nullable)
    - Populated only when refund is successfully completed
  - reason → optional explanation

  - refund_transaction_id → string (nullable)
      - Reference from payment gateway
  - gateway_response → JSON (nullable)
      - Raw refund response for audit/debug

  - created_at, updated_at → timestamps
  - created_by_user_id → references User (nullable for system-initiated refunds)

- Functionalities / Behaviors
  - Refund lifecycle:
    1. Created with Pending
    2. Processed via payment gateway (if applicable)
    3. Updated to Completed or Failed
  - Refunds:
      - May be partial or full
      - Multiple refunds may exist for a single payment
  - Booking payment status is recalculated based on:
      - Completed payments
      - Completed refunds

- Constraints / Rules
  - amount > 0
  - amount ≤ remaining refundable amount of the payment
  - Refund cannot be modified after:
      - status = Completed
  - Refunds cannot be deleted under any circumstance
  - Payment amount is never modified during refund
    - Refunds are separate financial records

### Entity: Transaction

- Purpose / Role
  - Represents an immutable financial ledger entry
  - Records all money movement related to bookings:
      - Payments, refunds and Manual adjustments
  - Serves as the single source of truth for financial reporting and audits

- Attributes
  - id → unique identifier
  - booking_id → optional reference
  - payment_id → optional reference
  - refund_id → optional reference

   - transaction_type → enum
      - Payment
      - Refund
      - Adjustment
  - amount → numeric
      - Positive for incoming money
      - Negative for outgoing money
  - currency → string
      - Should match Booking currency
  - transaction_date → timestamp
      - Time the transaction is recorded

  - notes → optional text
      - Reason for adjustment or context

  - created_at → timestamp
  - created_by_user_id → references User (nullable for system-generated entries)

- Functionalities / Behaviors
  - Automatically created when:
    - Payment is completed → Payment transaction
    - Refund is completed → Refund transaction
  - Manual adjustments:
    - Created only by authorized users
    - Must include notes
  - Used for:
    - Financial reporting
    - Reconciliation
    - Audits

- Constraints / Rules
  - amount ≠ 0
  - If transaction_type = Payment:
    - payment_id must be present
    - amount > 0
  - If transaction_type = Refund:
    - refund_id must be present
    - amount < 0
  - If transaction_type = Adjustment:
    - Either sign allowed
    - notes required
  - Transaction cannot be updated or deleted

### Entity: CancellationPolicy

- Purpose / Role
  - Defines deterministic refund rules when a booking is cancelled
  - Ensures consistent refund behavior across bookings
  - Removes ad-hoc or manual refund decisions

- Attributes
  - id → unique identifier
  - hotel_id → reference to Hotel / Resort

  - hours_before_checkin → numeric
  - refund_percentage → numeric
  - is_active → boolean
  - priority → integer

  - start_date → start date (inclusive)
  - end_date → end date (nullable)

  - notes → optional explanation
  - created_at, updated_at → timestamps
  - created_by_user_id → references User
  - updated_by_user_id → references User

- Functionalities / Behaviors
  - Applied when a booking is cancelled:
      1. Calculate hours between current time and hotel check-in time
      2. Select the best matching active policy:
          - Same hotel
          - Valid date range
          - Highest hours_before_checkin ≤ actual_hours
          - Highest priority if needed
      3. Calculate refundable amount
      4. Trigger Refund(s) accordingly
  - Refund calculation uses:
      - Amount already paid
      - Policy refund_percentage
      - Never exceeds paid amount

- Constraints / Rules
  - hours_before_checkin ≥ 0
  - refund_percentage ≥ 0 AND ≤ 100
  - For same hotel_id:
      - Multiple policies allowed
      - Policies must not conflict logically
      - Priority resolves ambiguity
  - Inactive policies are ignored
  - Policies cannot be deleted if:
      - Referenced by any completed cancellation
  - Prefer soft delete over hard delete

### Entity: IdempotencyKey

- Purpose / Role
  - Ensures idempotent behavior for critical write operations
  - Prevents duplicate execution of the same request due to:
      - Network retries
      - Client timeouts
      - Accidental double submissions
  - Commonly used for:
      - Booking creation
      - Payment initiation
      - Refund initiation

- Attributes
  - id → unique identifier
  - key → unique idempotency key
  - scope → enum
      - Booking
      - Payment
      - Refund
  - request_hash → string
      - Hash of request payload
      - Ensures same key is not reused with different data
  - response_snapshot → JSON (nullable)

  - status → enum
      - InProgress
      - Completed
      - Failed
  - resource_id → integer (nullable)
      - ID of created resource (booking_id, payment_id, refund_id)

  - expires_at → timestamp
      - Key automatically expires after safe duration

  - created_at, updated_at → timestamps


- Functionalities / Behaviors
  - Client sends Idempotency-Key header for critical POST requests
  - Server flow:
      1. Look up key + scope
      2. If Completed → return stored response
      3. If InProgress → reject or wait
      4. If not found → create with InProgress
      5. Execute operation
      6. Store result and mark Completed

- Constraints / Rules
  - key must be unique per scope
  - Same key cannot be reused with different request_hash
  - IdempotencyKey rows:
      - Are never updated after Completed except expiry
      - Can be safely cleaned up after expires_at
  - Keys are mandatory for:
      - Booking creation
      - Payment creation
      - Refund initiation

### Entity: AuditLog

- Purpose / Role
  - Records who did what, when, and where in the system
  - Provides a tamper-resistant audit trail for:
      - Security
      - Compliance
      - Debugging
      - Operational accountability
  - Captures state-changing actions only (not read-only events)

- Attributes
  - id → unique identifier

  - user_id → references User
      - NULL for system or guest-initiated actions

  - actor_type → enum
      - User
      - Guest
      - System

  - action → string
      - Examples: CREATE_BOOKING, UPDATE_BOOKING, DELETE_BOOKING,APPLY_COUPON

  - entity_type → string
      - Examples: Booking, Payment, Refund

  - entity_id → integer
      - ID of affected entity

  - before_state → JSON
  - after_state → JSON

  - ip_address → string
  - user_agent → string
  - request_id → string

  - created_at → timestamp

- Functionalities / Behaviors

  - Automatically created for:
    - All CREATE / UPDATE / DELETE operations
    - Authentication events (login, logout, failed login)
    - Permission or access denials
    - Financial actions (payment, refund)

  - Written
    - Inside the same DB transaction as the action (where possible)
    - Or immediately after successful commit

- Constraints / Rules
    - Audit logs:
      - Cannot be updated
      - Cannot be deleted
    - Sensitive data must:
        - Be masked
        - Or omitted entirely
    - AuditLog writes must never block core business logic

### Entity: Notification

- Purpose / Role
  - Represents a message or alert sent to a user or guest
  - Supports system notifications without requiring message queues
  - Provides delivery tracking and retry visibility

- Attributes
  - id → unique identifier
  - recipient_type → enum
      - User
      - Guest

  - recipient_user_id → reference to User (nullable)
  - recipient_email → string (nullable)
  - recipient_phone → string (nullable)

  - channel → enum
      - Email
      - SMS
      - Push
      - Whatsapp
      - Telegram

  - template_key → string
      - Example: BOOKING_CONFIRMED, PAYMENT_FAILED

  - title → string (nullable)
  - message → text
  - payload → JSON (nullable)
  - status -> enum
      - Pending
      - Sent
      - Failed

  - retry_count → integer
  - last_attempt_at → timestamp

  - entity_type → string
      - Examples: Booking, Payment, Refund
  - entity_id → integer

  - created_at, updated_at → timestamps

- Functionalities / Behaviors

  - Created when:
    - Booking confirmed / cancelled
    - Payment completed / failed
    - Refund processed

  - Delivery:
    - Attempted synchronously or via lightweight background job
    - Retried up to configured limit

  - Notification failure:
    - Must not block core business logic