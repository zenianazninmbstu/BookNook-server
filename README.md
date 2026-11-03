📚 BookNook – Server

BookNook is a small online library platform where users can explore books, manage their personal book collections, and borrow and return books. This repository contains the backend server built with Express.js and MongoDB.

🛠️ Technologies Used

- Node.js
- Express.js
- MongoDB
- Better Auth
- JOSE
- CORS
- dotenv

✨ Features

- Retrieve all available books.
- View individual book details.
- Add new books to the library.
- Update and delete books.
- Borrow available books.
- View personal borrowing records.
- Return borrowed books.
- JWT-based authentication for protected API routes.
- Track available book copies.

 🔗 API Endpoints

| Method | Endpoint       | Description                 | Access    |
| ------ | -------------- | --------------------------- | --------- |
| GET    | /books         | Get all books               | Public    |
| GET    | /books/:id     | Get book details            | Public    |
| POST   | /books         | Add a new book              | Protected |
| PATCH  | /books/:id     | Update a book               | Protected |
| DELETE | /books/:id     | Delete a book               | Protected |
| POST   | /borrows       | Borrow a book               | Protected |
| GET    | /borrows       | Get personal borrow records | Protected |
| DELETE | /borrows/:id   | Return a borrowed book      | Protected |

 🚀 Installation and Setup

1. Install Dependencies


npm install


 2. Configure Environment Variables

Create a .env file in the project root with these variables:


MONGODB_URI=

BETTER_AUTH_URL=



3. Start the Server


nodemon index.js


The server runs at:

http://localhost:5000

🗄️ Database Structure

**Database:** booknook

**Collections:**

- books – Stores book information and available copies.
- borrows – Stores borrowing records, user email, borrow date, and return date.

🔐 Authentication

Protected routes use JWT verification with Better Auth JWKS.

A valid Bearer token must be included in the Authorization header when accessing protected endpoints.

---

**BookNook – Discover, Borrow, and Enjoy Reading!**
