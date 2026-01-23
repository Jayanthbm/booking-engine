const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const prisma = new PrismaClient();

const sendNotification = async (data) => {
    // data: { recipientType, recipientUserId, recipientEmail, recipientPhone, channel, templateKey, title, message, payload, entityType, entityId }
    try {
        await prisma.notification.create({
            data: {
                recipientType: data.recipientType || 'User',
                recipientUserId: data.recipientUserId || null,
                recipientEmail: data.recipientEmail,
                recipientPhone: data.recipientPhone,
                channel: data.channel,
                templateKey: data.templateKey,
                title: data.title,
                message: data.message,
                payload: data.payload,
                status: 'Pending', // Default
                entityType: data.entityType,
                entityId: data.entityId
            }
        });

        // Trigger actual sending logic here (email/sms provider)
        // For V1, we just log it and assume a background worker picks up 'Pending' notifications 
        // OR we can simulate sending immediately.
        logger.info(`Notification queued for ${data.recipientEmail || data.recipientPhone}: ${data.templateKey}`);

    } catch (err) {
        logger.error('Failed to create notification:', err);
    }
};

module.exports = {
    sendNotification
};
