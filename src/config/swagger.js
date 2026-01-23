const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Hotel Booking Engine API',
            version: '1.0.0',
            description: 'API documentation for the Hotel Booking Engine',
            license: {
                name: 'ISC',
                url: 'https://opensource.org/licenses/ISC',
            },
            contact: {
                name: 'Jayanthbharadwaj M',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        mobile: { type: 'string' },
                        isActive: { type: 'boolean' },
                        roleId: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Role: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        isActive: { type: 'boolean' }
                    }
                },
                Permission: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        isSystem: { type: 'boolean' }
                    }
                },
                Hotel: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        address: { type: 'string' },
                        description: { type: 'string' },
                        contactEmail: { type: 'string' },
                        contactPhone: { type: 'string' },
                        timezone: { type: 'string' },
                        currency: { type: 'string' },
                        checkInTime: { type: 'string', format: 'date-time' },
                        checkOutTime: { type: 'string', format: 'date-time' },
                        isActive: { type: 'boolean' }
                    }
                },
                RoomType: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        hotelId: { type: 'integer' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        maxAdults: { type: 'integer' },
                        maxChildren: { type: 'integer' },
                        basePrice: { type: 'number' },
                        amenities: { type: 'object' },
                        isActive: { type: 'boolean' }
                    }
                },
                Room: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        hotelId: { type: 'integer' },
                        roomTypeId: { type: 'integer' },
                        roomNumber: { type: 'string' },
                        status: { type: 'string', enum: ['Available', 'Maintenance', 'OutOfService'] },
                        isActive: { type: 'boolean' }
                    }
                },
                Booking: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        hotelId: { type: 'integer' },
                        roomId: { type: 'integer' },
                        guestName: { type: 'string' },
                        checkInDate: { type: 'string', format: 'date-time' },
                        checkOutDate: { type: 'string', format: 'date-time' },
                        totalPrice: { type: 'number' },
                        status: { type: 'string', enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'] },
                        paymentStatus: { type: 'string', enum: ['Pending', 'PartiallyPaid', 'FullyPaid', 'Refunded'] }
                    }
                },
                Payment: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        bookingId: { type: 'integer' },
                        amount: { type: 'number' },
                        paymentMode: { type: 'string' },
                        paymentStatus: { type: 'string', enum: ['Pending', 'Completed', 'Failed'] },
                        transactionId: { type: 'string' }
                    }
                }
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
