import "dotenv/config";
import { MongoClient } from "mongodb";

const db = new MongoClient(process.env.MONGODB_URI);
await db.connect();
const books = db.db("booknook").collection("books");

// Known good Open Library cover ids / ISBNs, verified by title+author match
const COVERS = {
  "The Alchemist": "https://covers.openlibrary.org/b/isbn/9780061122415-L.jpg",
  "Atomic Habits": "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
  "Rich Dad Poor Dad": "https://covers.openlibrary.org/b/isbn/9781612680194-L.jpg",
  "The Hobbit": "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
  "A Brief History of Time": "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg",
  "The Psychology of Money": "https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg",
  "Harry Potter and the Philosopher's Stone": "https://covers.openlibrary.org/b/isbn/9780747532743-L.jpg",
  "The Little Prince": "https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg",
  "Wonder": "https://covers.openlibrary.org/b/isbn/9780375869020-L.jpg",
  "The 7 Habits of Highly Effective People": "https://covers.openlibrary.org/b/isbn/9781982137274-L.jpg",
  "The Kite Runner": "https://covers.openlibrary.org/b/isbn/9781594631931-L.jpg",
  "The Silent Patient": "https://covers.openlibrary.org/b/isbn/9781250301697-L.jpg",
  "The Origin of Species": "https://covers.openlibrary.org/b/isbn/9780451524355-L.jpg",
  "The Book Thief": "https://covers.openlibrary.org/b/isbn/9780375842207-L.jpg",
  "Deep Work": "https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg",
};

async function coversOk(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return false;
    // Open Library returns a 1x1 blank pixel when no cover exists
    const len = Number(res.headers.get("content-length") ?? "0");
    return len === 0 || len > 1000;
  } catch {
    return false;
  }
}

const all = await books.find().toArray();
let added = 0;
const missing = [];

for (const book of all) {
  const url = COVERS[book.title];

  if (!url) {
    missing.push(book.title);
    continue;
  }

  if (await coversOk(url)) {
    await books.updateOne({ _id: book._id }, { $set: { image: url } });
    added++;
    console.log(`OK   ${book.title}`);
  } else {
    missing.push(`${book.title} (bad cover url)`);
  }
}

console.log(`\nAdded cover to ${added} books`);
if (missing.length) console.log("Missing:", missing);

await db.close();
