const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Transaction = require("./models/transaction");
const dotenv = require("dotenv");

dotenv.config();

const insertData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data.json"), "utf-8")
    );

    // Ensure the dateOfSale fields are properly formatted
    data.forEach((item) => {
      item.dateOfSale = new Date(item.dateOfSale);
    });

    const result = await Transaction.insertMany(data);
    console.log("Data inserted successfully:", result);
  } catch (error) {
    console.error("Error inserting data:", error);
  } finally {
    mongoose.connection.close();
  }
};

insertData();
