const roleService = require('../services/role.service');
const catchAsync = require('../utils/catchAsync');
const apiResponse = require('../utils/apiResponse');

const createRole = catchAsync(async (req, res) => {
    const role = await roleService.createRole(req.body);
    apiResponse(res, 201, 'Role created successfully', role);
});

const updateRole = catchAsync(async (req, res) => {
    const role = await roleService.updateRole(req.params.id, req.body);
    apiResponse(res, 200, 'Role updated successfully', role);
});

const deleteRole = catchAsync(async (req, res) => {
    await roleService.deleteRole(req.params.id);
    apiResponse(res, 200, 'Role deleted successfully');
});

const listRoles = catchAsync(async (req, res) => {
    const roles = await roleService.listRoles();
    apiResponse(res, 200, 'Roles retrieved', roles);
});

const getRole = catchAsync(async (req, res) => {
    const role = await roleService.getRole(req.params.id);
    apiResponse(res, 200, 'Role retrieved', role);
});

module.exports = {
    createRole,
    updateRole,
    deleteRole,
    listRoles,
    getRole
};
