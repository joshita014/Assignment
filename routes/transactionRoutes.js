const express = require("express");
const {
  initializeDatabase,
  listTransactions,
  getStatistics,
  getBarChart,
  getPieChart,
  getAllData,
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/initialize", initializeDatabase);
router.get("/transactions", listTransactions);
router.get("/statistics", getStatistics);
router.get("/barchart", getBarChart);
router.get("/piechart", getPieChart);
router.get("/alldata", getAllData);

module.exports = router;
