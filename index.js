import express from "express";
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';
import cors from "cors";
import { jwtVerify, createRemoteJWKSet } from "jose";



const app = express();
app.use(cors({
  origin: "http://localhost:3000"
}));

app.use(express.json());
const port = 5000;





const client = new MongoClient(process.env.MONGODB_URI);

const db = client.db("booknook");
const booksCollection = db.collection("books");
const borrowsCollection = db.collection("borrows");


const JWKS = createRemoteJWKSet(
  new URL(`${process.env.BETTER_AUTH_URL}/api/auth/jwks`)
);


async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send({
        message: "Unauthorized: Token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    const { payload } = await jwtVerify(token, JWKS);

    req.user = payload;

    next();
  } catch (error) {
    console.error("JWT verification failed:", error);

    return res.status(401).send({
      message: "Unauthorized: Invalid token",
    });
  }
}

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}



//http://localhost:5000

app.get("/", (req, res) => {
  res.send("BookNook Server is Running!");
});


app.get("/books", async (req, res) => {
  try {
    const { sort, limit } = req.query;

    let query = booksCollection.find();

    if (sort === "newest") {
      query = query.sort({ addedAt: -1, _id: -1 });
    }

    if (limit) {
      query = query.limit(Number(limit));
    }

    const books = await query.toArray();
    res.send(books);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to get books" });
  }
});






app.get("/books/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const book = await booksCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!book) {
      return res.status(404).send({
        message: "Book not found"
      });
    }

    res.send(book);

  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to get book"
    });
  }
});



app.patch("/books/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const userEmail = req.user.email;

    const {
      title,
      author,
      category,
      image,
      description,
      totalCopies,
    } = req.body;

    const result = await booksCollection.updateOne(
      {
        _id: new ObjectId(id),
        addedByEmail: userEmail,
      },
      {
        $set: {
          title,
          author,
          category,
          image,
          description,
          totalCopies,
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Book not found or unauthorized",
      });
    }

    res.send({ message: "Book updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Failed to update book",
    });
  }
});

app.delete("/books/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const userEmail = req.user.email;

    const result = await booksCollection.deleteOne({
      _id: new ObjectId(id),
      addedByEmail: userEmail,
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Book not found or unauthorized",
      });
    }

    res.send({
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to delete book",
    });
  }
});
app.post("/books", verifyToken, async (req, res) => {
  try {
   const newBook = {
  ...req.body,
  addedBy: req.user.name,
  addedByEmail: req.user.email,
  addedAt: new Date(),
};

    const result = await booksCollection.insertOne(newBook);

    res.status(201).send({
      message: "Book added successfully",
      insertedId: result.insertedId
    });

  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to add book"
    });
  }
});


app.post("/borrows", verifyToken, async (req, res) => {
  try {
   const {
  bookId,
  bookTitle,
  bookImage,
  borrowDate,
  returnDate,
} = req.body;

const userEmail = req.user.email;



    // Check required fields
    if (
      !bookId ||
      !bookTitle ||
      !userEmail ||
      !borrowDate ||
      !returnDate
    ) {
      return res.status(400).send({
        message: "Required fields are missing",
      });
    }

    // Check whether the book exists
    const book = await booksCollection.findOne({
      _id: new ObjectId(bookId),
    });

    if (!book) {
      return res.status(404).send({
        message: "Book not found",
      });
    }

    // Check duplicate active borrow
    const existingBorrow = await borrowsCollection.findOne({
      bookId,
      userEmail,
    });

    if (existingBorrow) {
      return res.status(409).send({
        message: "You have already borrowed this book",
      });
    }

    // Decrease available copies only if copies are available
    const updateResult = await booksCollection.updateOne(
      {
        _id: new ObjectId(bookId),
        totalCopies: { $gt: 0 },
      },
      {
        $inc: { totalCopies: -1 },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).send({
        message: "This book is not available",
      });
    }

    // Save borrow information
    const borrowInfo = {
      bookId,
      bookTitle,
      bookImage: bookImage || "",
      userEmail,
      borrowDate,
      returnDate,
    };

    const result = await borrowsCollection.insertOne(borrowInfo);

    res.status(201).send({
      message: "Book borrowed successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Failed to borrow book",
    });
  }
});



app.get("/borrows", verifyToken, async (req, res) => {
  try {
   const userEmail = req.user.email;

    if (!userEmail) {
      return res.status(400).send({
        message: "User email is required",
      });
    }

    const borrows = await borrowsCollection
      .find({ userEmail })
      .toArray();

    res.send(borrows);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to get borrowed books",
    });
  }
});
app.delete("/borrows/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const userEmail = req.user.email;

    const borrow = await borrowsCollection.findOne({
      _id: new ObjectId(id),
      userEmail,
    });

    if (!borrow) {
      return res.status(404).send({
        message: "Borrow record not found",
      });
    }

    const updateResult = await booksCollection.updateOne(
      { _id: new ObjectId(borrow.bookId) },
      { $inc: { totalCopies: 1 } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).send({
        message: "Book not found",
      });
    }

    await borrowsCollection.deleteOne({
      _id: new ObjectId(id),
      userEmail,
    });

    res.send({
      message: "Book returned successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to return book",
    });
  }
});
async function startServer() {
  await connectToMongoDB();

  app.listen(port, () => {
    console.log(`BookNook server is running on port ${port}`);
  });
}

startServer();
