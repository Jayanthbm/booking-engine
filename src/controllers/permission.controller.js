const permissionService = require('../services/permission.service');
const catchAsync = require('../utils/catchAsync');
const apiResponse = require('../utils/apiResponse');

const createPermission = catchAsync(async (req, res) => {
    const permission = await permissionService.createPermission(req.body);
    apiResponse(res, 201, 'Permission created successfully', permission);
});

const listPermissions = catchAsync(async (req, res) => {
    const permissions = await permissionService.listPermissions();
    apiResponse(res, 200, 'Permissions retrieved', permissions);
});

const deletePermission = catchAsync(async (req, res) => {
    await permissionService.deletePermission(req.params.id);
    apiResponse(res, 200, 'Permission deleted successfully');
});

module.exports = {
    createPermission,
    listPermissions,
    deletePermission
};
