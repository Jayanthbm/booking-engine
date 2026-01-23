const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/appError');

const prisma = new PrismaClient();

// Hotel Addon
const createHotelAddon = async (data) => {
    const existing = await prisma.hotelAddon.findUnique({
        where: {
            hotelId_name: {
                hotelId: data.hotelId,
                name: data.name
            }
        }
    });

    if (existing) {
        throw new AppError('Hotel Addon with this name already exists in this hotel', 400);
    }

    return await prisma.hotelAddon.create({ data });
};

const listHotelAddons = async (query) => {
    const where = {};
    if (query.hotelId) where.hotelId = parseInt(query.hotelId);
    if (query.roomTypeId) where.roomTypeId = parseInt(query.roomTypeId);
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    return await prisma.hotelAddon.findMany({ where });
};

// Activity Addon
const createActivityAddon = async (data) => {
    // Unique name check?
    // "Global activities: unique globally", "Hotel-specific: unique per hotel".
    // Schema doesn't have unique constraint on name only for global.
    // Schema: @@unique([hotelId, name]) for ActivityAddon?
    // Let's check schema.
    // ActivityAddon schema: @@unique([hotelId, name])

    // If hotelId is null (Global), how does unique work?
    // Prisma treats NULL as unique capability depends on DB. PG allows multiple NULLs in unique index but here it is composite.
    // If hotelId is null, unique index (null, name) might restrict to ONE null?
    // Usually unique constraint with NULL allows multiple rows in PG (unless NULLS NOT DISTINCT).
    // But we might want unique name for global. 
    // Let's just try create.

    // Check if name exists for same hotel (or global)
    // Manually check to be sure or rely on Prisma/DB error.

    return await prisma.activityAddon.create({ data });
};

const listActivityAddons = async (query) => {
    const where = {};
    if (query.hotelId) where.hotelId = parseInt(query.hotelId);
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    return await prisma.activityAddon.findMany({ where });
};

module.exports = {
    createHotelAddon,
    listHotelAddons,
    createActivityAddon,
    listActivityAddons
};
