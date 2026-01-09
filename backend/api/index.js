const express = require("express");
const router = express.Router();
const testDbRouter = require("./test-db");
const pollsRouter = require("./polls");
const ballotsRouter = require("./ballots");

router.use("/test-db", testDbRouter);
router.use("/polls", pollsRouter);
router.use("/ballots", ballotsRouter);

module.exports = router;
