import express from "express";
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';
import cors from "cors";



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
    const books = await booksCollection.find().toArray();
    res.send(books);
  } catch (error) {
    res.status(500).send({ message: "Failed to get books" });
  }
});



// Get the 10 newest books (newest first)
app.get("/books/latest", async (req, res) => {
  try {
    const books = await booksCollection
      .find()
      .sort({ _id: -1 })
      .limit(10)
      .toArray();

    res.send(books);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to get latest books",
    });
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



app.patch("/books/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedBook = req.body;

    const result = await booksCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedBook }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Book not found"
      });
    }

    res.send({
      message: "Book updated successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to update book"
    });
  }
});


app.delete("/books/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await booksCollection.deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Book not found"
      });
    }

    res.send({
      message: "Book deleted successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to delete book"
    });
  }
});


app.post("/books", async (req, res) => {
  try {
    const newBook = req.body;

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


async function startServer() {
  await connectToMongoDB();

  app.listen(port, () => {
    console.log(`BookNook server is running on port ${port}`);
  });
}

startServer();
