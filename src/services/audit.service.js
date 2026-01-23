const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const prisma = new PrismaClient();

const logAudit = async (data) => {
    // data: { userId, actorType, action, entityType, entityId, beforeState, afterState, ipAddress, userAgent, requestId }
    try {
        await prisma.auditLog.create({
            data: {
                userId: data.userId || null,
                actorType: data.actorType || 'System',
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                beforeState: data.beforeState,
                afterState: data.afterState,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                requestId: data.requestId
            }
        });
    } catch (err) {
        // Audit log failure should not block main flow, but we should log it
        logger.error('Failed to write audit log:', err);
    }
};

module.exports = {
    logAudit
};
