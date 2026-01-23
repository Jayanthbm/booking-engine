const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const idempotency = (scope) => {
    return async (req, res, next) => {
        // Only for mutating methods
        if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
            return next();
        }

        const key = req.headers['idempotency-key'];
        if (!key) {
            return next(new AppError('Idempotency-Key header is missing', 400));
        }

        // Create a hash of the request body to ensure consistency
        const hash = crypto
            .createHash('sha256')
            .update(JSON.stringify(req.body || {}))
            .digest('hex');

        try {
            // Check for existing key
            const existingKey = await prisma.idempotencyKey.findUnique({
                where: {
                    key_scope: {
                        key: key,
                        scope: scope
                    }
                }
            });

            if (existingKey) {
                if (existingKey.requestHash !== hash) {
                    return next(new AppError('Idempotency-Key is reused with different payload', 409));
                }

                if (existingKey.status === 'Completed') {
                    // Return stored response
                    logger.info(`Idempotency hit for key: ${key}`);
                    return res.status(existingKey.responseSnapshot.statusCode).json(existingKey.responseSnapshot.body);
                }

                if (existingKey.status === 'InProgress') {
                    // Processing is still happening
                    return next(new AppError('Request with this Idempotency-Key is currently being processed', 409));
                }
            }

            // No existing key, or different key. Create InProgress record
            // If we are here, we are starting a new operation
            if (!existingKey) {
                // Expiration: 24 hours
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                await prisma.idempotencyKey.create({
                    data: {
                        key,
                        scope,
                        requestHash: hash,
                        status: 'InProgress',
                        expiresAt
                    }
                });
            }

            // Hook response to save snapshot
            const originalSend = res.json;
            res.json = function (body) {
                // Restore original to avoid infinite loop if we call it again
                res.json = originalSend;

                // Async update (fire and forget, or await?)
                // Better to await to ensure consistency, but might slow down response. 
                // For strict correctness, we should wait, or at least handle errors.
                const statusCode = res.statusCode;

                // We only save successful or deterministic client error responses. 
                // 500s might be retried safely if we don't mark as completed.
                // Actually, if it failed, we might want to allow retry.

                if (statusCode < 500) {
                    prisma.idempotencyKey.update({
                        where: {
                            key_scope: {
                                key: key,
                                scope: scope
                            }
                        },
                        data: {
                            status: 'Completed',
                            responseSnapshot: {
                                statusCode,
                                body
                            }
                        }
                    }).catch(err => {
                        logger.error('Failed to update idempotency key:', err);
                    });
                } else {
                    // If server error, maybe delete key or leave as InProgress (will expire)? 
                    // Or ideally delete it so client can retry.
                    prisma.idempotencyKey.delete({
                        where: {
                            key_scope: {
                                key: key,
                                scope: scope
                            }
                        }
                    }).catch(err => {
                        logger.error('Failed to delete failed idempotency key:', err);
                    });
                }

                return originalSend.call(this, body);
            };

            next();
        } catch (err) {
            logger.error('Idempotency Middleware Error:', err);
            next(new AppError('Idempotency check failed', 500));
        }
    };
};

module.exports = idempotency;
