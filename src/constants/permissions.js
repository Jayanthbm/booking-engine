const Permissions = {
    // User Management
    USER_CREATE: 'USER_CREATE',
    USER_EDIT: 'USER_EDIT',
    USER_DELETE: 'USER_DELETE',
    USER_VIEW: 'USER_VIEW',

    // Role Management
    ROLE_CREATE: 'ROLE_CREATE',
    ROLE_EDIT: 'ROLE_EDIT',
    ROLE_DELETE: 'ROLE_DELETE',
    ROLE_VIEW: 'ROLE_VIEW', // Also covers Permission View

    // Permission Management
    PERMISSION_CREATE: 'PERMISSION_CREATE', // If needed
    PERMISSION_VIEW: 'PERMISSION_VIEW',
    PERMISSION_DELETE: 'PERMISSION_DELETE',

    // Hotel Management
    HOTEL_CREATE: 'HOTEL_CREATE',
    HOTEL_EDIT: 'HOTEL_EDIT',
    HOTEL_DELETE: 'HOTEL_DELETE',
    HOTEL_VIEW: 'HOTEL_VIEW',

    // Room Type Management
    ROOM_TYPE_CREATE: 'ROOM_TYPE_CREATE',
    ROOM_TYPE_EDIT: 'ROOM_TYPE_EDIT',
    ROOM_TYPE_DELETE: 'ROOM_TYPE_DELETE',
    ROOM_TYPE_VIEW: 'ROOM_TYPE_VIEW',

    // Room Management
    ROOM_CREATE: 'ROOM_CREATE',
    ROOM_EDIT: 'ROOM_EDIT',
    ROOM_DELETE: 'ROOM_DELETE',
    ROOM_VIEW: 'ROOM_VIEW',

    // Booking Management
    BOOKING_CREATE: 'BOOKING_CREATE',
    BOOKING_EDIT: 'BOOKING_EDIT', // Modify dates, guests
    BOOKING_CANCEL: 'BOOKING_CANCEL',
    BOOKING_DELETE: 'BOOKING_DELETE', // Admin only
    BOOKING_VIEW: 'BOOKING_VIEW',

    // Payment & Finance
    PAYMENT_PROCESS: 'PAYMENT_PROCESS',
    PAYMENT_REFUND: 'PAYMENT_REFUND',
    PAYMENT_VIEW: 'PAYMENT_VIEW',
    TRANSACTION_VIEW: 'TRANSACTION_VIEW', // Ledger view

    // Pricing & Inventory
    PRICING_MANAGE: 'PRICING_MANAGE', // Dynamic pricing, age rules, tax rules, coupons
    AVAILABILITY_MANAGE: 'AVAILABILITY_MANAGE', // Block dates, etc.

    // Addons
    ADDON_CREATE: 'ADDON_CREATE',
    ADDON_EDIT: 'ADDON_EDIT',
    ADDON_DELETE: 'ADDON_DELETE',
    ADDON_VIEW: 'ADDON_VIEW',

    // System/Dashboard
    DASHBOARD_VIEW: 'DASHBOARD_VIEW',
    AUDIT_VIEW: 'AUDIT_VIEW'
};

module.exports = Permissions;
