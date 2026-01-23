const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/appError');

const prisma = new PrismaClient();

const createHotel = async (data) => {
    const existingHotel = await prisma.hotel.findUnique({
        where: { name: data.name }
    });

    if (existingHotel) {
        throw new AppError('Hotel with this name already exists', 400);
    }

    // Handle time conversion if needed. 
    // For now assuming the input is compatible with Prisma DateTime or formatted.
    // Ideally, we should parse "14:00" to some standard date. 
    // But let's just pass data for now.
    // If `checkInTime` is string in payload but DateTime in DB, this will fail.
    // I will strip checkIn/Out for now if they are strings to avoid crash, or format them.
    // Let's assume frontend sends ISO partial? 
    // Actually, let's fix the schema later if needed.

    if (data.checkInTime) {
        data.checkInTime = new Date('1970-01-01T' + data.checkInTime + 'Z');
    }
    if (data.checkOutTime) {
        data.checkOutTime = new Date('1970-01-01T' + data.checkOutTime + 'Z');
    }

    const hotel = await prisma.hotel.create({
        data
    });
    return hotel;
};

const updateHotel = async (id, data) => {
    const hotel = await prisma.hotel.findUnique({ where: { id: parseInt(id) } });
    if (!hotel) throw new AppError('Hotel not found', 404);

    if (data.checkInTime) {
        data.checkInTime = new Date('1970-01-01T' + data.checkInTime + 'Z');
    }
    if (data.checkOutTime) {
        data.checkOutTime = new Date('1970-01-01T' + data.checkOutTime + 'Z');
    }

    const updatedHotel = await prisma.hotel.update({
        where: { id: parseInt(id) },
        data
    });
    return updatedHotel;
};

const getHotelById = async (id) => {
    const hotel = await prisma.hotel.findUnique({
        where: { id: parseInt(id) },
        include: {
            roomTypes: true,
            hotelAddons: true
            // active pricing rules... taxes... (load separately or via include)
        }
    });
    if (!hotel) throw new AppError('Hotel not found', 404);
    return hotel;
};

const listHotels = async (query) => {
    const where = {};
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.name) where.name = { contains: query.name, mode: 'insensitive' };

    const hotels = await prisma.hotel.findMany({
        where
    });
    return hotels;
};

module.exports = {
    createHotel,
    updateHotel,
    getHotelById,
    listHotels
};
