const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/appError');

const prisma = new PrismaClient();

const searchAvailability = async (query) => {
    const { hotelId, checkIn, checkOut, adults, children } = query;

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut); // Exclusive

    // 1. Find all active rooms in the hotel that match capacity and are active/available
    // We first find potential RoomTypes to return structured data? 
    // Or just find rooms and aggregate.

    // Let's get all RoomTypes for the hotel first to filter by capacity
    const roomTypes = await prisma.roomType.findMany({
        where: {
            hotelId: parseInt(hotelId),
            isActive: true,
            maxAdults: { gte: parseInt(adults) },
            maxChildren: { gte: parseInt(children) }
        },
        include: {
            rooms: {
                where: {
                    isActive: true,
                    status: 'Available'
                },
                select: { id: true }
            }
        }
    });

    if (roomTypes.length === 0) {
        return [];
    }

    // Flatten all candidate room IDs
    const candidateRoomIds = roomTypes.flatMap(rt => rt.rooms.map(r => r.id));

    if (candidateRoomIds.length === 0) {
        return [];
    }

    // 2. Check unavailability for these rooms in the date range
    // We look for any "isBooked" record in the range [startDate, endDate)
    const unavailableRooms = await prisma.roomAvailability.findMany({
        where: {
            roomId: { in: candidateRoomIds },
            isBooked: true,
            date: {
                gte: startDate,
                lt: endDate
            }
        },
        select: { roomId: true },
        distinct: ['roomId']
    });

    const unavailableRoomIdSet = new Set(unavailableRooms.map(r => r.roomId));

    // 3. Filter rooms that are NOT in unavailable set
    // And construct result grouped by RoomType
    const result = roomTypes.map(rt => {
        const availableRoomsCount = rt.rooms.filter(r => !unavailableRoomIdSet.has(r.id)).length;

        // We can also calculate price estimate here if needed, but for now just availability
        if (availableRoomsCount > 0) {
            // Return room type details + available count
            // Remove 'rooms' list from output to keep it clean
            const { rooms, ...rtData } = rt;
            return {
                ...rtData,
                availableRooms: availableRoomsCount
            };
        }
        return null;
    }).filter(Boolean);

    return result;
};

module.exports = {
    searchAvailability
};
