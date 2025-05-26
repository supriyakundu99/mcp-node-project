# Express PostgreSQL App

This project is a basic Express application that connects to a PostgreSQL database. It demonstrates how to set up an Express server and interact with a PostgreSQL database using Docker.

## Project Structure

```
mcp-node-test
├── src
│   ├── app.js          # Entry point of the application
│   └── db.js           # Database connection logic
├── .env                # Environment variables
├── docker-compose.yml   # Docker configuration
├── package.json        # NPM configuration
└── README.md           # Project documentation
```

## Prerequisites

- Docker and Docker Compose installed on your machine.
- Node.js and npm installed.

## Setup Instructions

1. Clone the repository:

   ```
   git clone <repository-url>
   cd mcp-node-test
   ```

2. Create a `.env` file in the root directory and add your database configuration:

   ```
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=db
   DB_PORT=5432
   DB_NAME=mcp_db
   ```

3. Build and run the application using Docker Compose:

   ```
   docker-compose up --build
   ```

4. Access the application at `http://localhost:3000`.

## Usage

- The application exposes a simple API that you can extend to interact with the PostgreSQL database.
- You can add your own routes in `src/app.js` and implement database queries in `src/db.js`.

## License

This project is licensed under the MIT License.