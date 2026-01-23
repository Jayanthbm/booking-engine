-- CreateTable
CREATE TABLE "BookingHotelAddon" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "addonId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingHotelAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingActivityAddon" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "addonId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingActivityAddon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingHotelAddon_bookingId_idx" ON "BookingHotelAddon"("bookingId");

-- CreateIndex
CREATE INDEX "BookingActivityAddon_bookingId_idx" ON "BookingActivityAddon"("bookingId");

-- AddForeignKey
ALTER TABLE "BookingHotelAddon" ADD CONSTRAINT "BookingHotelAddon_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHotelAddon" ADD CONSTRAINT "BookingHotelAddon_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "HotelAddon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingActivityAddon" ADD CONSTRAINT "BookingActivityAddon_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingActivityAddon" ADD CONSTRAINT "BookingActivityAddon_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "ActivityAddon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
