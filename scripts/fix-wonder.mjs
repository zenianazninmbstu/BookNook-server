import "dotenv/config";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();

const result = await client
  .db("booknook")
  .collection("books")
  .updateOne(
    { title: "Wonder" },
    { $set: { image: "https://covers.openlibrary.org/b/isbn/9780375869020-L.jpg" } }
  );

console.log("matched:", result.matchedCount, "modified:", result.modifiedCount);

// Final verification: every book must now have an image
const all = await client.db("booknook").collection("books").find().toArray();
const withoutImage = all.filter((b) => !b.image);
console.log("total books:", all.length, "| without image:", withoutImage.length);

await client.close();
