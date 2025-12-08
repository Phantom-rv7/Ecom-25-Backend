// import express from "express";
// import { adminOnly } from "../middlewares/auth.js";
// import { allCoupons, appplyDiscount, deleteCoupon, newCoupon, createRazorpayOrder, updateCoupon, getCoupon, verifyRazorpayPayment } from "../controllers/payment.js";
 

// import crypto from "crypto";

// const app = express.Router();

// //route * /api/v1/payment/create-order
// app.post('/create-order', createRazorpayOrder);
// app.post('/verify', verifyRazorpayPayment);

// // app.post("/create-order", createOrder);


// //route * /api/v1/payment/coupon/new
// app.get("/discount",appplyDiscount);

// //route * /api/v1/payment/coupon/new
// app.post("/coupon/new",adminOnly ,newCoupon);

// //route * /api/v1/payment/coupon/all
// app.get("/coupon/all",adminOnly, allCoupons);


// // ✅ New webhook route
// app.post("/webhook", express.json({ type: "*/*" }), (req, res) => {
//   const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

//   // Generate HMAC SHA256 signature
//   const shasum = crypto.createHmac("sha256", secret);
//   shasum.update(JSON.stringify(req.body));
//   const digest = shasum.digest("hex");

//   const signature = req.headers["x-razorpay-signature"];

//   if (digest === signature) {
//     console.log("✅ Webhook verified:", req.body.event);

//     // Handle events
//     switch (req.body.event) {
//       case "payment.captured":
//         // Mark order as paid in DB
//         console.log("Payment captured:", req.body.payload.payment.entity.id);
//         break;
//       case "payment.failed":
//         console.log("Payment failed:", req.body.payload.payment.entity.id);
//         break;
//       case "order.paid":
//         console.log("Order paid:", req.body.payload.order.entity.id);
//         break;
//       default:
//         console.log("Unhandled event:", req.body.event);
//     }

//     res.status(200).json({ status: "ok" });
//   } else {
//     console.log("❌ Invalid webhook signature");
//     res.status(400).json({ status: "invalid signature" });
//   }
// });

// // //route * /api/v1/payment/coupon/id
// app
//     .route("/coupon/:id")
//     .get(adminOnly,getCoupon)
//     .put(adminOnly, updateCoupon)
//     .delete(adminOnly ,deleteCoupon)



// export default app;






import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  allCoupons,
  appplyDiscount,
  deleteCoupon,
  newCoupon,
  createRazorpayOrder,
  updateCoupon,
  getCoupon,
  verifyRazorpayPayment,
} from "../controllers/payment.js";

import crypto from "crypto";

const app = express.Router();

// --------------------
// Razorpay Order Routes
// --------------------
app.post("/create-order", createRazorpayOrder);
app.post("/verify", verifyRazorpayPayment);

// --------------------
// Coupon Routes
// --------------------
app.get("/discount", appplyDiscount);
app.post("/coupon/new", adminOnly, newCoupon);
app.get("/coupon/all", adminOnly, allCoupons);

app
  .route("/coupon/:id")
  .get(adminOnly, getCoupon)
  .put(adminOnly, updateCoupon)
  .delete(adminOnly, deleteCoupon);

// --------------------
// Razorpay Webhook Route
// --------------------
// NOTE: use express.raw() so signature verification works correctly
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(req.body); // raw buffer
    const digest = shasum.digest("hex");

    const signature = req.headers["x-razorpay-signature"];

    if (digest === signature) {
      console.log("✅ Webhook verified:", req.body.event);

      // Parse JSON manually since we used express.raw()
      const payload = JSON.parse(req.body.toString());

      switch (payload.event) {
        case "payment.captured":
          console.log("Payment captured:", payload.payload.payment.entity.id);
          // Example: update order in DB
          // await Order.findOneAndUpdate(
          //   { razorpay_payment_id: payload.payload.payment.entity.id },
          //   { status: "paid" }
          // );
          break;

        case "payment.failed":
          console.log("Payment failed:", payload.payload.payment.entity.id);
          // await Order.findOneAndUpdate(
          //   { razorpay_payment_id: payload.payload.payment.entity.id },
          //   { status: "failed" }
          // );
          break;

        case "order.paid":
          console.log("Order paid:", payload.payload.order.entity.id);
          break;

        default:
          console.log("Unhandled event:", payload.event);
      }

      res.status(200).json({ status: "ok" });
    } else {
      console.log("❌ Invalid webhook signature");
      res.status(400).json({ status: "invalid signature" });
    }
  }
);

export default app;
