# Enums

```sql
-- Booking status
CREATE TYPE booking_status AS ENUM ('Pending', 'Confirmed', 'Cancelled', 'Completed');

-- Payment status
CREATE TYPE payment_status AS ENUM ('Pending', 'Advance Paid', 'Fully Paid', 'Refunded', 'Failed', 'Completed');

-- Payment mode
CREATE TYPE payment_mode AS ENUM ('Cash', 'Card', 'UPI', 'Other');

-- Room status
CREATE TYPE room_status AS ENUM ('Available', 'Maintenance', 'Out of Service');

-- Who booked
CREATE TYPE booked_by AS ENUM ('Guest', 'Receptionist');

-- Transaction type
CREATE TYPE transaction_type AS ENUM ('Payment', 'Refund', 'Adjustment');

-- Entity type for dynamic or age-based pricing
CREATE TYPE entity_type AS ENUM ('RoomType', 'HotelAddOn', 'ActivityAddOn');

```

# Tables

1. Users

```sql
CREATE TABLE users (
id SERIAL PRIMARY KEY,
username VARCHAR(50) UNIQUE NOT NULL,
password TEXT NOT NULL,
email VARCHAR(100) UNIQUE NOT NULL,
mobile VARCHAR(15),
role_id INT REFERENCES roles(id),
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_role_id ON users(role_id);

```

2. roles

```sql
CREATE TABLE roles (
id SERIAL PRIMARY KEY,
name VARCHAR(50) UNIQUE NOT NULL,
description TEXT,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);

```

3. permissions

```sql
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

```

4. role_permissions

```sql
CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

```

5. hotels

```sql
CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    images TEXT[], -- array of URLs
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by_user_id INT REFERENCES users(id),
    updated_by_user_id INT REFERENCES users(id)
);

CREATE INDEX idx_hotels_name ON hotels(name);

```

6. room_types

```sql
CREATE TABLE room_types (
    id SERIAL PRIMARY KEY,
    hotel_id INT REFERENCES hotels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_adults INT NOT NULL,
    max_children INT NOT NULL,
    bed_type VARCHAR(50),
    amenities TEXT[], -- array of amenities
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by_user_id INT REFERENCES users(id),
    updated_by_user_id INT REFERENCES users(id),
    UNIQUE (hotel_id, name)
);

CREATE INDEX idx_room_types_hotel_id ON room_types(hotel_id);

```

7. rooms

```sql

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    hotel_id INT REFERENCES hotels(id) ON DELETE CASCADE,
    room_type_id INT REFERENCES room_types(id) ON DELETE CASCADE,
    room_number VARCHAR(20) NOT NULL,
    floor VARCHAR(10),
    status room_status DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by_user_id INT REFERENCES users(id),
    updated_by_user_id INT REFERENCES users(id),
    UNIQUE(hotel_id, room_number)
);


CREATE INDEX idx_rooms_room_type_id ON rooms(room_type_id);

```

8. hotel_addons

```sql
CREATE TABLE hotel_addons (
    id SERIAL PRIMARY KEY,
    hotel_id INT REFERENCES hotels(id) ON DELETE CASCADE,
    room_type_id INT REFERENCES room_types(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
    per_guest BOOLEAN DEFAULT FALSE,
    images TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by_user_id INT REFERENCES users(id),
    updated_by_user_id INT REFERENCES users(id),
    UNIQUE (hotel_id, name)
);

CREATE INDEX idx_hotel_addons_hotel_id ON hotel_addons(hotel_id);
CREATE INDEX idx_hotel_addons_room_type_id ON hotel_addons(room_type_id);

```

9. activity_addons

```sql

CREATE TABLE activity_addons (
    id SERIAL PRIMARY KEY,
    hotel_id INT REFERENCES hotels(id),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
    per_guest BOOLEAN DEFAULT FALSE,
    images TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by_user_id INT REFERENCES users(id),
    updated_by_user_id INT REFERENCES users(id)
);

CREATE INDEX idx_activity_addons_hotel_id ON activity_addons(hotel_id);

```

10.dynamic_pricing

```sql
CREATE TABLE dynamic_pricing (
    id SERIAL PRIMARY KEY,
    entity_type entity_type NOT NULL,
    entity_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by_user_id INT REFERENCES users(id),
    updated_by_user_id INT REFERENCES users(id),
    CONSTRAINT chk_dates CHECK (start_date < end_date)
);


CREATE INDEX idx_dynamic_pricing_entity ON dynamic_pricing(entity_type, entity_id);
CREATE INDEX idx_dynamic_pricing_date_range ON dynamic_pricing(start_date, end_date);

```

11. age_based_pricing

```sql

CREATE TABLE age_based_pricing (
    id SERIAL PRIMARY KEY,
    entity_type entity_type NOT NULL,
    entity_id INT NOT NULL,
    age INT NOT NULL CHECK (age >= 0),
    price_factor NUMERIC(5,2) NOT NULL CHECK (price_factor >= 0 AND price_factor <= 1),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by_user_id INT REFERENCES users(id),
    updated_by_user_id INT REFERENCES users(id),
    UNIQUE (entity_type, entity_id, age)
);


CREATE INDEX idx_age_based_pricing_entity ON age_based_pricing(entity_type, entity_id);

```

12. coupons

```sql

CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_percentage NUMERIC(5,2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    usage_limit INT DEFAULT -1, -- -1 = unlimited
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_coupon_dates CHECK (start_date < end_date)
);

CREATE INDEX idx_coupons_start_end ON coupons(start_date, end_date);

```

13. bookings

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
    base_room_price NUMERIC(10,2) NOT NULL,
    total_room_price NUMERIC(10,2) NOT NULL,
    hotel_addons_total NUMERIC(10,2) NOT NULL,
    activity_addons_total NUMERIC(10,2) NOT NULL,
    total_discount NUMERIC(10,2) DEFAULT 0,
    total_price NUMERIC(10,2) NOT NULL,
    coupon_code VARCHAR(50),
    invoice VARCHAR(100),
    payment_mode payment_mode,
    payment_status payment_status DEFAULT 'Pending',
    status booking_status DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by_user_id INT REFERENCES users(id),
    updated_by_user_id INT REFERENCES users(id),
    CONSTRAINT chk_dates CHECK (check_in_date < check_out_date)
);


CREATE INDEX idx_bookings_hotel_id ON bookings(hotel_id);
CREATE INDEX idx_bookings_room_type_id ON bookings(room_type_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_coupon_code ON bookings(coupon_code);

```

14. bookings_hotel_addons

```sql

CREATE TABLE booking_hotel_addons (
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    hotel_addon_id INT REFERENCES hotel_addons(id),
    quantity INT DEFAULT 1,
    price NUMERIC(10,2),
    PRIMARY KEY (booking_id, hotel_addon_id)
);

```

15. bookings_activity_addons

```sql

CREATE TABLE booking_activity_addons (
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    activity_addon_id INT REFERENCES activity_addons(id),
    quantity INT DEFAULT 1,
    price NUMERIC(10,2),
    PRIMARY KEY (booking_id, activity_addon_id)
);

```

16. booking_coupons

```sql

CREATE TABLE booking_coupons (
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    coupon_id INT REFERENCES coupons(id),
    discount_amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_booking_coupons_booking_id ON booking_coupons(booking_id);
CREATE INDEX idx_booking_coupons_coupon_id ON booking_coupons(coupon_id);

```

17. payments

```sql

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMP DEFAULT NOW(),
    payment_mode payment_mode,
    payment_status payment_status DEFAULT 'Pending',
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE INDEX idx_payments_booking_id ON payments(booking_id);

```

18. refunds

```sql

CREATE TABLE refunds (
    id SERIAL PRIMARY KEY,
    payment_id INT REFERENCES payments(id),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    refund_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'Pending',
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);

```

19. transactions

```sql
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id),
    payment_id INT REFERENCES payments(id),
    refund_id INT REFERENCES refunds(id),
    amount NUMERIC(10,2) NOT NULL,
    transaction_type transaction_type NOT NULL,
    transaction_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE INDEX idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX idx_transactions_refund_id ON transactions(refund_id);

```
