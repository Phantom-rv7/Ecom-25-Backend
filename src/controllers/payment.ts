import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-class.js";
import Razorpay from 'razorpay';
import { Request, Response } from 'express';
import crypto from "crypto";
import { Order } from "../models/order.js"; // make sure this path is correct
import { invalidatesCache } from "../utils/feautures.js";
import { OrderItemType } from "../types/types.js";
import dotenv from 'dotenv';
import mongoose from "mongoose";
dotenv.config();


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const razorpaySecret = process.env.RAZORPAY_KEY_SECRET!;

export const createRazorpayOrder = async (req: Request, res: Response) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // paise
    currency: 'INR',
    receipt: `order_rcptid_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create Razorpay order', error });
  }
};



// export const verifyRazorpayPayment = TryCatch(async (req, res, next) => {
//   const {
//     razorpayPaymentId,
//     razorpayOrderId,
//     razorpaySignature,
//     orderItems,
//     shippingInfo,
//     user,
//     subtotal,
//     tax,
//     discount,
//     shippingCharges,
//     total
//   } = req.body;


//   const requiredFields = [
//     razorpayPaymentId,
//     razorpayOrderId,
//     razorpaySignature,
//     orderItems,
//     shippingInfo,
//     user,
//     subtotal,
//     tax,
//     discount,
//     shippingCharges,
//     total
//   ];

// if (requiredFields.some((field) => field === undefined || field === null)) {
//   return next(new ErrorHandler("Please enter all required fields", 400));
// }

//   if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
//     return next(new ErrorHandler("Missing Razorpay credentials", 400));
//   }

// const body = `${razorpayOrderId}|${razorpayPaymentId}`;
// const generatedSignature = crypto
//   .createHmac("sha256", razorpaySecret)
//   .update(body)
//   .digest("hex");
//   console.log("🔐 Comparing Signatures:");
// console.log("Generated:", generatedSignature);
// console.log("Received:", razorpaySignature);


// if (generatedSignature !== razorpaySignature) {
//   return next(new ErrorHandler("Payment verification failed", 400));
// }
// console.log("🧾 Required Fields Check:");
// requiredFields.forEach((field, i) => {
//   console.log(`Field ${i}:`, field);
// });

//   try {

//   await Order.create({
//     user,
//     orderItems,
//     shippingInfo,
//     subtotal,
//     tax,
//     discount,
//     shippingCharges,
//     total,
//     paymentInfo: {
//       razorpayPaymentId,
//       razorpayOrderId,
//       razorpaySignature,
//     },
//     paidAt: new Date(),
//   });
// } catch (error) {
//   if (error instanceof Error) {
//     console.error("❌ Order creation failed:", error); // ✅ Add this
//   return next(new ErrorHandler("Order creation failed", 500));
//   } else {
    
//   }
//   return next(new ErrorHandler("Order creation failed", 500));
// }

//   invalidatesCache({
//   product: true,
//   order: true,
//   admin: true,
//   userId: String(user), // ✅ use destructured `user`
//   productId: orderItems.map((i: OrderItemType) => String(i.productId)),
// });

//   return res.status(201).json({
//     success: true,
//     message: "Payment verified and order created",
//   });
// });


//COUPON FEAUTURES
export const verifyRazorpayPayment = TryCatch(async (req, res, next) => {
  const {
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    orderItems,
    shippingInfo,
    user,
    subtotal,
    tax,
    discount,
    shippingCharges,
    total,
  } = req.body;

  const requiredFields = [
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    orderItems,
    shippingInfo,
    user,
    subtotal,
    tax,
    discount,
    shippingCharges,
    total,
  ];

  if (requiredFields.some((field) => field === undefined || field === null)) {
    return next(new ErrorHandler("Please enter all required fields", 400));
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const generatedSignature = crypto
    .createHmac("sha256", razorpaySecret)
    .update(body)
    .digest("hex");


  if (generatedSignature !== razorpaySignature) {
    return next(new ErrorHandler("Payment verification failed", 400));
  }

  try {
    const order = await Order.create({
      user,
      orderItems: orderItems.map((item: OrderItemType) => ({
        ...item,
        productId: new mongoose.Types.ObjectId(item.productId), // ✅ ensure ObjectId
      })),
      shippingInfo: {
        ...shippingInfo,
        pinCode: Number(shippingInfo.pinCode), // ✅ ensure number
      },
      subtotal,
      tax,
      discount,
      shippingCharges,
      total,
      customOrderId: `retro${Math.random().toString(36).substring(2, 10)}`, // ✅ optional
    });

    invalidatesCache({
      product: true,
      order: true,
      admin: true,
      userId: String(user),
      productId: order.orderItems.map((i) => String(i.productId)),
    });

    return res.status(201).json({
      success: true,
      message: "Payment verified and order created",
    });
  } catch (error) {
    console.error("❌ Order creation failed:", error);
    return next(new ErrorHandler("Order creation failed", 500));
  }
});


export const newCoupon = TryCatch(async (req, res, next) => {
  const {code, amount} = req.body;

  if(!code || !amount) 
    return next(new ErrorHandler("Please enter both coupon and amount", 400));
  
  await Coupon.create({code: code, amount });
  
  return res.status(201). json({
    success:true,
    message:`Coupon ${code} Created Successfully`,
  })
})


export const appplyDiscount = TryCatch(async (req, res, next) => {
  const { coupon } = req.query;

  const discount = await Coupon.findOne({ code:coupon })
  
  if(!discount) 
    return next(new ErrorHandler ("Invalid Coupon Code", 400));

  return res.status(200). json({
    success:true,
    discount:discount.amount,
  })
})


export const allCoupons = TryCatch(async (req, res, next) => {

  const coupons = await Coupon.find({})

  return res.status(200). json({
    success:true,
    coupons,
  })
})

export const getCoupon = TryCatch(async (req, res, next) => {

  const{ id } = req.params;

  const coupon =  await Coupon.findById(id);

  if(!coupon) return next(new ErrorHandler("Invalid Coupon ID", 400));

  return res.status(200). json({
    success:true,
    coupon,
  })
})


export const updateCoupon = TryCatch(async (req, res, next) => {

  const{ id } = req.params;

  const {code, amount} = req.body;

  const coupon =  await Coupon.findById(id);

  if(!coupon) return next(new ErrorHandler("Invalid Coupon ID", 400));

  if(code) coupon.code = code;
  if(amount) coupon.amount = amount;

  await coupon.save();

  return res.status(200). json({
    success:true,
    message:`Coupon ${coupon.code} Updated Successfully`,
  })
})


export const deleteCoupon = TryCatch(async (req, res, next) => {

  const{ id } = req.params;

  const coupon =  await Coupon.findByIdAndDelete(id);

  if(!coupon) return next(new ErrorHandler("Invalid Coupon ID", 400));

  return res.status(200). json({
    success:true,
    message:`Coupon ${coupon.code} Deleted Successfully`,
  })
})




