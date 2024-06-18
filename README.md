

1. **Create a New User**
   - **Method:** POST
   - **Route:** `/users`
   - **Description:** Creates a new user with the specified details and returns a JWT token for authentication.
   - **Sample Payload:**
     ```json
     {
       "name": "john",
       "surname": "doe",
       "username": "jdoe",
       "birthdate": "2000-01-01"
     }
     ```
   - **Return:** JWT token

2. **Retrieve All Users**
   - **Method:** GET
   - **Route:** `/users/all`
   - **Description:** Retrieves a list of all users.

3. **Retrieve a User by Authorization Header**
   - **Method:** GET
   - **Route:** `/users`
   - **Headers:** `Authorization: Bearer <token>`
   - **Description:** Retrieves a user based on the provided JWT token in the authorization header.

4. **Delete a User by Authorization Header**
   - **Method:** DELETE
   - **Route:** `/users`
   - **Headers:** `Authorization: Bearer <token>`
   - **Description:** Deletes a user based on the provided JWT token in the authorization header.

5. **Block a User**
   - **Method:** POST
   - **Route:** `/users/block/:id`
   - **Headers:** `Authorization: Bearer <token>`
   - **URL Parameter:** `id` (User ID to block)
   - **Description:** Blocks a user based on the provided user ID and JWT token in the authorization header.

6. **Unblock a User**
   - **Method:** POST
   - **Route:** `/users/unblock/:id`
   - **Headers:** `Authorization: Bearer <token>`
   - **URL Parameter:** `id` (User ID to unblock)
   - **Description:** Unblocks a user based on the provided user ID and JWT token in the authorization header.

7. **Search for Users**
   - **Method:** GET
   - **Route:** `/users/search`
   - **Headers:** `Authorization: Bearer <token>`
   - **Query Parameters:**
     - `username` (optional): Username to search for.
     - `minAge` (optional): Minimum age of the users to search for.
     - `maxAge` (optional): Maximum age of the users to search for.
   - **Description:** Searches for users based on the provided criteria (username, minAge, maxAge) and JWT token in the authorization header.

**Note:** For routes requiring an authorization header, replace `<token>` with the actual JWT token provided upon user creation.