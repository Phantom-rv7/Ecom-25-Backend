import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { allCoupons, appplyDiscount, deleteCoupon, newCoupon, createRazorpayOrder, updateCoupon, getCoupon, verifyRazorpayPayment } from "../controllers/payment.js";
 
const app = express.Router();

//route * /api/v1/payment/create-order
app.post('/create-order', createRazorpayOrder);
app.post('/verify', verifyRazorpayPayment);

// app.post("/create-order", createOrder);


//route * /api/v1/payment/coupon/new
app.get("/discount",appplyDiscount);

//route * /api/v1/payment/coupon/new
app.post("/coupon/new",adminOnly ,newCoupon);

//route * /api/v1/payment/coupon/all
app.get("/coupon/all",adminOnly, allCoupons);

// //route * /api/v1/payment/coupon/id
app
    .route("/coupon/:id")
    .get(adminOnly,getCoupon)
    .put(adminOnly, updateCoupon)
    .delete(adminOnly ,deleteCoupon)



export default app;
