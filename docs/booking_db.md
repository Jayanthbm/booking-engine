## 🔷 Enums

```sql
-- Booking status
CREATE TYPE booking_status AS ENUM (
  'Pending',
  'Confirmed',
  'Cancelled',
  'Completed'
);

-- Booking payment summary status
CREATE TYPE booking_payment_status AS ENUM (
  'Pending',
  'Partially Paid',
  'Fully Paid',
  'Refunded'
);

-- Payment status
CREATE TYPE payment_status AS ENUM (
  'Pending',
  'Completed',
  'Failed'
);

-- Payment mode
CREATE TYPE payment_mode AS ENUM (
  'Cash',
  'Card',
  'UPI',
  'Wallet',
  'Bank Transfer',
  'Other'
);

-- Room status
CREATE TYPE room_status AS ENUM (
  'Available',
  'Maintenance',
  'Out of Service'
);

-- Who booked
CREATE TYPE booked_by AS ENUM (
  'Guest',
  'Receptionist'
);

-- Transaction type
CREATE TYPE transaction_type AS ENUM (
  'Payment',
  'Refund',
  'Adjustment'
);

-- Pricing entity type
CREATE TYPE pricing_entity_type AS ENUM (
  'RoomType',
  'HotelAddOn',
  'ActivityAddOn'
);

-- Tax type
CREATE TYPE tax_type AS ENUM (
  'Percentage',
  'Fixed'
);

-- Tax applicability
CREATE TYPE tax_applicable_on AS ENUM (
  'Room',
  'HotelAddOn',
  'ActivityAddOn',
  'Total'
);

-- Idempotency scope
CREATE TYPE idempotency_scope AS ENUM (
  'Booking',
  'Payment',
  'Refund'
);

-- Notification channel
CREATE TYPE notification_channel AS ENUM (
  'Email',
  'SMS',
  'Push',
  'Whatsapp',
  'Telegram'
);

-- Notification status
CREATE TYPE notification_status AS ENUM (
  'Pending',
  'Sent',
  'Failed'
);
```

---

## 🔷 Core Auth & RBAC

### permissions

```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### roles

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### role_permissions

```sql
CREATE TABLE role_permissions (
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_permission_id
  ON role_permissions(permission_id);
```

---

## 🔷 Users

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  mobile VARCHAR(15) UNIQUE,
  role_id INT REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id INT REFERENCES users(id),
  updated_by_user_id INT REFERENCES users(id)
);

CREATE INDEX idx_users_role_id ON users(role_id);
```

---

## 🔷 Hotels

```sql
CREATE TABLE hotels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  timezone VARCHAR(50),
  check_in_time TIME,
  check_out_time TIME,
  currency VARCHAR(3),
  images TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id INT REFERENCES users(id),
  updated_by_user_id INT REFERENCES users(id)
);
```

---

## 🔷 Room Types

```sql
CREATE TABLE room_types (
  id SERIAL PRIMARY KEY,
  hotel_id INT REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  max_adults INT NOT NULL,
  max_children INT NOT NULL,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  bed_type VARCHAR(50),
  amenities JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id INT REFERENCES users(id),
  updated_by_user_id INT REFERENCES users(id),
  UNIQUE (hotel_id, name)
);
```

---

## 🔷 Rooms

```sql
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  hotel_id INT REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id INT REFERENCES room_types(id),
  room_number VARCHAR(20) NOT NULL,
  floor VARCHAR(10),
  status room_status DEFAULT 'Available',
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id INT REFERENCES users(id),
  updated_by_user_id INT REFERENCES users(id),
  UNIQUE (hotel_id, room_number)
);
```

---

## 🔷 Add-ons

### hotel_addons

```sql
CREATE TABLE hotel_addons (
  id SERIAL PRIMARY KEY,
  hotel_id INT REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id INT REFERENCES room_types(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  per_guest BOOLEAN DEFAULT FALSE,
  max_quantity INT,
  is_active BOOLEAN DEFAULT TRUE,
  images TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id INT REFERENCES users(id),
  updated_by_user_id INT REFERENCES users(id),
  UNIQUE (hotel_id, name)
);
```

### activity_addons

```sql
CREATE TABLE activity_addons (
  id SERIAL PRIMARY KEY,
  hotel_id INT REFERENCES hotels(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  per_guest BOOLEAN DEFAULT FALSE,
  max_quantity INT,
  is_active BOOLEAN DEFAULT TRUE,
  images TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id INT REFERENCES users(id),
  updated_by_user_id INT REFERENCES users(id),
  UNIQUE (hotel_id, name)
);
```

---

## 🔷 Dynamic Pricing

```sql
CREATE TABLE dynamic_pricing (
  id SERIAL PRIMARY KEY,
  entity_type pricing_entity_type NOT NULL,
  entity_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id INT REFERENCES users(id),
  updated_by_user_id INT REFERENCES users(id),
  CHECK (start_date < end_date)
);

CREATE INDEX idx_dynamic_pricing_entity
  ON dynamic_pricing(entity_type, entity_id);
```

---

## 🔷 Age-Based Pricing

```sql
CREATE TABLE age_based_pricing (
  id SERIAL PRIMARY KEY,
  entity_type pricing_entity_type NOT NULL,
  entity_id INT NOT NULL,
  age INT NOT NULL CHECK (age >= 0),
  price_factor NUMERIC(5,2) NOT NULL CHECK (price_factor >= 0 AND price_factor <= 1),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id INT REFERENCES users(id),
  updated_by_user_id INT REFERENCES users(id),
  UNIQUE (entity_type, entity_id, age)
);
```

---

## 🔷 Coupons

```sql
CREATE TABLE coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  max_discount_amount NUMERIC(10,2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  minimum_spend NUMERIC(10,2) DEFAULT 0,
  usage_limit INT DEFAULT -1,
  usage_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id INT REFERENCES users(id),
  CHECK (start_date < end_date)
);
```

---

## 🔷 Room Availability (Critical)

```sql
CREATE TABLE room_availability (
  id SERIAL PRIMARY KEY,
  room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  booking_id INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (room_id, date)
);
```

---

## 🔷 Bookings

```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  hotel_id INT REFERENCES hotels(id),
  room_type_id INT REFERENCES room_types(id),
  room_id INT REFERENCES rooms(id),

  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_adults INT NOT NULL,
  num_children INT NOT NULL,

  guest_name VARCHAR(150) NOT NULL,
  guest_email VARCHAR(100),
  guest_phone VARCHAR(20),

  booked_by booked_by NOT NULL,
  status booking_status DEFAULT 'Pending',
  status_changed_at TIMESTAMP,
  status_reason TEXT,

  base_room_price NUMERIC(10,2) NOT NULL,
  room_price_total NUMERIC(10,2) NOT NULL,
  hotel_addons_total NUMERIC(10,2) NOT NULL,
  activity_addons_total NUMERIC(10,2) NOT NULL,
  subtotal_price NUMERIC(10,2) NOT NULL,
  tax_total NUMERIC(10,2) NOT NULL,
  total_discount NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,

  price_breakdown JSONB,
  coupon_code VARCHAR(50),

  invoice_number VARCHAR(100),
  invoice_url TEXT,

  payment_status booking_payment_status DEFAULT 'Pending',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id INT REFERENCES users(id),
  updated_by_user_id INT REFERENCES users(id),

  CHECK (check_in_date < check_out_date)
);
```

---

## 🔷 Payments / Refunds / Transactions

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_mode payment_mode,
  payment_status payment_status DEFAULT 'Pending',
  payment_date TIMESTAMP,
  transaction_id VARCHAR(100),
  gateway_name VARCHAR(50),
  gateway_response JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id INT REFERENCES users(id)
);
```

```sql
CREATE TABLE refunds (
  id SERIAL PRIMARY KEY,
  payment_id INT REFERENCES payments(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status payment_status DEFAULT 'Pending',
  refund_date TIMESTAMP,
  reason TEXT,
  refund_transaction_id VARCHAR(100),
  gateway_response JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id INT REFERENCES users(id)
);
```

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id),
  payment_id INT REFERENCES payments(id),
  refund_id INT REFERENCES refunds(id),
  transaction_type transaction_type NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  transaction_date TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id INT REFERENCES users(id)
);
```

---

## 🔷 Idempotency Keys

```sql
CREATE TABLE idempotency_keys (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL,
  scope idempotency_scope NOT NULL,
  request_hash TEXT NOT NULL,
  response_snapshot JSONB,
  status VARCHAR(20) NOT NULL,
  resource_id INT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (key, scope)
);
```

---

## 🔷 Audit Logs

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  actor_type VARCHAR(20),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  before_state JSONB,
  after_state JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  request_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔷 Notifications

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  recipient_type VARCHAR(20),
  recipient_user_id INT REFERENCES users(id),
  recipient_email VARCHAR(100),
  recipient_phone VARCHAR(20),
  channel notification_channel NOT NULL,
  template_key VARCHAR(100),
  title VARCHAR(255),
  message TEXT NOT NULL,
  payload JSONB,
  status notification_status DEFAULT 'Pending',
  retry_count INT DEFAULT 0,
  last_attempt_at TIMESTAMP,
  entity_type VARCHAR(50),
  entity_id INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
