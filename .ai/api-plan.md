```markdown
# REST API Plan

## 1. Resources
- **Diagrams**  
  Based on the database "diagrams" table (defined in the migration and database.types.ts), this resource represents a visual or data diagram with fields such as id, title, content, created_at, updated_at, etc.

## 2. Endpoints

### Diagrams Endpoints

#### List Diagrams
- **Method:** GET  
- **URL:** `/diagrams`  
- **Description:** Retrieves a list of diagrams with support for pagination, filtering, and sorting.
- **Query Parameters:**  
  - `page` (number): Page number for pagination  
  - `limit` (number): Number of diagrams per page  
  - `sortBy` (string): Field to sort results  
  - `filter` (string): Search filter (e.g. by title)
- **Response Payload Example:**  
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "Example Diagram",
        "definition": "...",
        "solution": "...",
        "created_at": "2025-10-13T12:00:00Z",
        "updated_at": "2025-10-13T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50
    }
  }
  ```
- **Success Codes:** 200 OK  
- **Error Codes:** 400 Bad Request, 500 Internal Server Error

#### Get Diagram by ID
- **Method:** GET  
- **URL:** `/diagrams/{id}`  
- **Description:** Retrieves the diagram identified by the provided ID.
- **URL Parameters:**  
  - `id` (number): Unique identifier of the diagram
- **Response Payload Example:**  
  ```json
  {
    "id": 1,
    "name": "Example Diagram",
    "definition": "...",
    "solution": "...",
    "created_at": "2025-10-13T12:00:00Z",
    "updated_at": "2025-10-13T12:00:00Z"
  }
  ```
- **Success Codes:** 200 OK  
- **Error Codes:** 404 Not Found, 500 Internal Server Error

#### Create Diagram
- **Method:** POST  
- **URL:** `/diagrams`  
- **Description:** Creates a new diagram.
- **Request Body Example (JSON):**  
  ```json
  {
    "name": "New Diagram",
    "definition": "Diagram definition goes here..."
  }
  ```
- **Response Payload Example:**  
  ```json
  {
    "id": 2,
    "name": "New Diagram",
    "definition": "Diagram definition goes here...",
    "created_at": "2025-10-13T12:05:00Z",
    "updated_at": "2025-10-13T12:05:00Z"
  }
  ```
- **Success Codes:** 201 Created  
- **Error Codes:** 400 Bad Request, 500 Internal Server Error

#### Update Diagram
- **Method:** PUT or PATCH  
- **URL:** `/diagrams/{id}`  
- **Description:** Updates the diagram with the provided ID.
- **URL Parameters:**  
  - `id` (number): Unique identifier of the diagram
- **Request Body Example (JSON):**  
  ```json
  {
    "name": "Updated Diagram Name",
    "definition": "Updated definition..."
  }
  ```
- **Response Payload Example:**  
  ```json
  {
    "id": 1,
    "name": "Updated Diagram Name",
    "definition": "Updated definition...",
    "created_at": "2025-10-13T12:00:00Z",
    "updated_at": "2025-10-13T12:10:00Z"
  }
  ```
- **Success Codes:** 200 OK  
- **Error Codes:** 400 Bad Request, 404 Not Found, 500 Internal Server Error

#### Delete Diagram
- **Method:** DELETE  
- **URL:** `/diagrams/{id}`  
- **Description:** Deletes the diagram with the specified ID.
- **URL Parameters:**  
  - `id` (number): Unique identifier of the diagram
- **Response Payload Example:**  
  ```json
  {
    "message": "Diagram deleted successfully."
  }
  ```
- **Success Codes:** 200 OK  
- **Error Codes:** 404 Not Found, 500 Internal Server Error

#### Solve Diagram
- **Method:** POST  
- **URL:** `/diagrams/{id}/solve`  
- **Description:** Generates and saves a solution for the diagram with the specified ID.
- **URL Parameters:**  
  - `id` (number): Unique identifier of the diagram
- **Response Payload Example:**  
  ```json
  {
    "id": 1,
    "name": "Example Diagram",
    "definition": "...",
    "solution": "Generated solution content...",
    "created_at": "2025-10-13T12:00:00Z",
    "updated_at": "2025-10-13T12:15:00Z"
  }
  ```
- **Success Codes:** 200 OK  
- **Error Codes:** 
  - 404 Not Found
  - 500 Internal Server Error

## 3. Authentication and Authorization
- **Mechanism:** JWT Bearer Token  
- **Implementation Details:**  
  - Clients must include a valid JWT in the Authorization header for protected endpoints (e.g. `Authorization: Bearer <token>`).  
  - Endpoints for diagram creation, updating, deleting, and sharing should enforce authentication and verify the user’s permissions.  
  - Certain endpoints (e.g. public listing) may be accessible without authentication depending on the product requirements.

## 4. Validation and Business Logic
- **Validation Rules:**  
  - **Diagram Creation/Update:**  
    - `name`: Must not be empty; maximum length enforced (e.g. 255 characters)  
    - `definition`: Must not be empty
  - Additional validations (e.g. unique name if required) will be enforced both at the application level and via database constraints.
- **Business Logic Implementation:**  
  - Standard CRUD operations map directly to the endpoints above.  
  - For operations that extend beyond CRUD (e.g. sharing), custom business logic is applied to check user permissions and notify collaborators if needed.  
  - Pagination, filtering, and sorting parameters are parsed and validated on the backend to ensure the API remains performant.  
  - Error responses include informative messages along with HTTP status codes to aid client debugging.

```