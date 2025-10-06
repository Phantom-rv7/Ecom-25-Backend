import express from "express";
import {
  addFavorite,
  removeFavorite,
  getFavorites,
} from "../controllers/favorites.js";

const router = express.Router();

// ➕ Add a product to favorites
router.post("/", addFavorite);

// ❌ Remove a product from favorites
router.delete("/:productId", removeFavorite);

// 📦 Get all favorites for a user
router.get("/", getFavorites);

export default router;
