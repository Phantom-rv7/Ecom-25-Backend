import express from "express";
import {  adminOnly } from "../middlewares/auth.js";
import {
  allOrders,
  deleteOrder,
  getSingleOrder,
  myOrders,
  newOrder,
  processOrder,
} from "../controllers/order.js";

const router = express.Router();

// 🛒 Place a new order (authenticated user only)
router.post("/new",  newOrder);

// 📦 Get orders for the authenticated user
router.get("/my", myOrders);

// 📊 Admin-only: Get all orders
router.get("/all", adminOnly, allOrders);

// 🔍 Get, update, or delete a specific order
router
  .route("/:id")
  .get( getSingleOrder)
  .put(adminOnly, processOrder)
  .delete( adminOnly, deleteOrder);


export default router;