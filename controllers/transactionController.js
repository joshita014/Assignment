const axios = require("axios");
const Transaction = require("../models/transaction");

const initializeDatabase = async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const transactions = response.data;

    await Transaction.deleteMany({});
    await Transaction.insertMany(transactions);

    res.status(200).json({ message: "Database initialized with seed data" });
  } catch (error) {
    console.error("Error initializing database:", error);
    res.status(500).json({ message: error.message });
  }
};

const listTransactions = async (req, res) => {
  const { month, search, page = 1, perPage = 10 } = req.query;
  const regex = new RegExp(search, "i"); // Case-insensitive search

  try {
    // Validate the month parameter
    const monthInt = parseInt(month, 10);
    if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
      throw new Error("Invalid month parameter.");
    }

    // Calculate the start and end dates for the given month
    const startOfMonth = new Date(2022, monthInt - 1, 1); // Note: month is 0-indexed
    const endOfMonth = new Date(2022, monthInt, 1); // Next month, 1st day

    const filter = {
      dateOfSale: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    };

    if (search) {
      filter.$or = [
        { title: regex },
        { description: regex },
        { price: { $regex: regex } },
      ];
    }

    const transactions = await Transaction.find(filter)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage));

    const totalTransactions = await Transaction.countDocuments(filter);

    res.status(200).json({
      page,
      perPage,
      total: totalTransactions,
      transactions,
    });
  } catch (error) {
    console.error("Error listing transactions:", error);
    res.status(500).json({ message: error.message });
  }
};

const getStatistics = async (req, res) => {
  const { month } = req.query;

  try {
    const startOfMonth = new Date(`2022-${month}-01`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const filter = {
      dateOfSale: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    };

    const totalSaleAmount = await Transaction.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);

    const totalSoldItems = await Transaction.countDocuments({
      ...filter,
      sold: true,
    });

    const totalNotSoldItems = await Transaction.countDocuments({
      ...filter,
      sold: false,
    });

    res.status(200).json({
      totalSaleAmount:
        totalSaleAmount.length > 0 ? totalSaleAmount[0].total : 0,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (error) {
    console.error("Error getting statistics:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getBarChart = async (req, res) => {
  const { month } = req.query;

  try {
    const startOfMonth = new Date(`2022-${month}-01`);
    const endOfMonth = new Date(`2022-${parseInt(month) + 1}-01`);
    const filter = {
      dateOfSale: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    };

    const priceRanges = [
      { range: "0-100", min: 0, max: 100 },
      { range: "101-200", min: 101, max: 200 },
      { range: "201-300", min: 201, max: 300 },
      { range: "301-400", min: 301, max: 400 },
      { range: "401-500", min: 401, max: 500 },
      { range: "501-600", min: 501, max: 600 },
      { range: "601-700", min: 601, max: 700 },
      { range: "701-800", min: 701, max: 800 },
      { range: "801-900", min: 801, max: 900 },
      { range: "901-above", min: 901, max: Infinity },
    ];

    const barChartData = await Promise.all(
      priceRanges.map(async (range) => {
        const count = await Transaction.countDocuments({
          ...filter,
          price: { $gte: range.min, $lt: range.max },
        });
        return { range: range.range, count };
      })
    );

    res.status(200).json(barChartData);
  } catch (error) {
    console.error("Error getting bar chart data:", error);
    res.status(500).json({ message: error.message });
  }
};

const getPieChart = async (req, res) => {
  const { month } = req.query;

  try {
    const startOfMonth = new Date(`2022-${month}-01`);
    const endOfMonth = new Date(`2022-${parseInt(month) + 1}-01`);
    const filter = {
      dateOfSale: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    };

    const pieChartData = await Transaction.aggregate([
      { $match: filter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { _id: 0, category: "$_id", count: 1 } },
    ]);

    res.status(200).json(pieChartData);
  } catch (error) {
    console.error("Error getting pie chart data:", error);
    res.status(500).json({ message: error.message });
  }
};

const getAllData = async (req, res) => {
  try {
    const [transactions, statistics, barChart, pieChart] = await Promise.all([
      listTransactions(req, res),
      getStatistics(req, res),
      getBarChart(req, res),
      getPieChart(req, res),
    ]);

    res.status(200).json({
      transactions,
      statistics,
      barChart,
      pieChart,
    });
  } catch (error) {
    console.error("Error getting all data:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  initializeDatabase,
  listTransactions,
  getStatistics,
  getBarChart,
  getPieChart,
  getAllData,
};
