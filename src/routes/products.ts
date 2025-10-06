// import express from "express";
// import { deleteProduct, getAdminProducts, getAllCategories, getAllProducts, getlatestProducts, getSingleProduct, newProduct, updateProduct } from "../controllers/product.js";
// import { singleUpload } from "../middlewares/multer.js";
// import { adminOnly } from "../middlewares/auth.js";
 
// const app = express.Router();

// //Create New Product - /api/v1/product/new
// app.post( "/new", adminOnly , singleUpload , newProduct )

// //To get all products with filter- /api/v1/product/all
// app.get("/all", getAllProducts)

// //To get last 10 products - /api/v1/product/latest
// app.get("/latest", getlatestProducts)

// //To get all unique categories - /api/v1/product/categories
// app.get("/categories", getAllCategories)

// //To get all Products - /api/v1/product/admin-products
// app.get("/admin-products", getAdminProducts)

// //to get update, delete of Product
// app
//   .route("/:id")
//   .get(getSingleProduct)
//   .put(adminOnly, singleUpload,updateProduct)
//   .delete(deleteProduct)
  
// app.route("/:id").get(getSingleProduct)

// export default app;

import express from "express";
import {
  allReviewsOfProducts,
  deleteProduct,
  deleteReview,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getlatestProducts,
  getSingleProduct,
  newProduct,
  newReview,
  updateProduct,
} from "../controllers/product.js";

import { multiUpload, singleUpload } from "../middlewares/multer.js";
import {  adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// 🔐 Create New Product - Admin Only
app.post("/new", adminOnly, multiUpload, newProduct);

// 🌐 Get All Products with Filters
app.get("/all", getAllProducts);

// 🆕 Get Latest 10 Products
app.get("/latest", getlatestProducts);

// 📦 Get All Unique Categories
app.get("/categories", getAllCategories);

// 🔐 Get All Admin Products - Admin Only
app.get("/admin-products", adminOnly, getAdminProducts);

// 🔍 Get, Update, Delete Single Product
app
  .route("/:id")
  .get(getSingleProduct) // Public
  .put( adminOnly, multiUpload, updateProduct) // Admin Only
  .delete( adminOnly, deleteProduct); // Admin Only


  //Review
  app.get("/reviews/:id",allReviewsOfProducts)
  app.post("/review/new/:id",newReview)
  app.delete("/review/:id",deleteReview)

export default app;


