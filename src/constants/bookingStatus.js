const BookingStatus = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed'
};

const PaymentStatus = {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
    PARTIALLY_PAID: 'PartiallyPaid',
    FULLY_PAID: 'FullyPaid'
};

const PaymentMode = {
    CASH: 'Cash',
    CARD: 'Card',
    UPI: 'UPI',
    WALLET: 'Wallet',
    BANK_TRANSFER: 'BankTransfer',
    OTHER: 'Other'
};

module.exports = {
    BookingStatus,
    PaymentStatus,
    PaymentMode
};
