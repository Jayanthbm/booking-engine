# Middlewares

## Joi Validation Middleware

     - Use Joi for input validation.
     - Validate request body, query parameters, and headers.
     - Use middleware to handle validation errors.
     - Return error response with status code and error message.

## Authentication Middleware

     - Use JWT for authentication.
     - Extract token from headers, cookies, or query parameters.
     - Verify token using secret key.
     - Return error response with status code and error message.

## Permission Checker Middleware

### Permission Checking Core Logic

1. **Authenticate the User**
   - Verify the user’s identity via JWT, session, or other auth token.
   - Extract the `user_id` from the authentication token.

2. **Retrieve User Role and Permissions**
   - Fetch the user’s role from the database.
   - Fetch all permissions associated with that role.
   - Optionally, cache permissions for performance.

3. **Define Required Permission for the API**
   - Each API endpoint specifies the single permission or list of permissions needed to perform that action.
   - Example: `ADD_HOTEL`, `EDIT_BOOKING`, `PROCESS_PAYMENT`.

4. **Check Permission**
   - Compare the user’s permissions against the required permission(s).
   - If the user has at least one required permission → allow access.
   - If the user does not have the required permission → deny access with `403 Forbidden`.

5. **Optional Object-Level Check**
   - Some actions may require further checks, e.g.:
     - User can only edit bookings they created.
     - User can only refund payments if they belong to their hotel.

   - This is checked **after the general permission check**.

6. **Proceed or Block**
   - If permission passes → proceed to the API handler.
   - If permission fails → stop execution, return error.
