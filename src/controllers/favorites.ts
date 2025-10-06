import { Request, Response } from "express";
import { Favorite } from "../models/favorites.js";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";

// 📌 Add a product to favorites
export const addFavorite = TryCatch(async (req: Request, res: Response, next) => {
  const { productId } = req.body;
  const { id: userId } = req.query;

  if (!userId) return next(new ErrorHandler("Please do Login First", 401));

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("Invalid User ID", 401));

  const exists = await Favorite.findOne({ user: userId, product: productId });
  if (exists) return res.status(400).json({ message: "Already favorited" });

  await Favorite.create({ user: userId, product: productId });
  res.status(201).json({ message: "Added to favorites" });
});

// 🗑️ Remove a product from favorites
export const removeFavorite = TryCatch(async (req: Request, res: Response, next) => {
  const { productId } = req.params;
  const { id: userId } = req.query;

  if (!userId) return next(new ErrorHandler("Please do Login First", 401));

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("Invalid User ID", 401));

  await Favorite.findOneAndDelete({ user: userId, product: productId });
  res.json({ message: "Removed from favorites" });
});

// 📦 Get all favorites for a user
export const getFavorites = TryCatch(async (req: Request, res: Response, next) => {
  const { id: userId } = req.query;

  if (!userId) return next(new ErrorHandler("Please do Login First", 401));

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("Invalid User ID", 401));

  const favorites = await Favorite.find({ user: userId }).populate("product");
  res.json(favorites.map((f) => f.product));
});
