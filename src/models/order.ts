import mongoose from "mongoose";

const schema =  new mongoose.Schema({
 
  shippingInfo:{
    address:{
      type:String,
      required:true,
  },
    city:{
        type:String,
        required:true,
      },
    state:{
        type:String,
        required:true,
      },
    pinCode:{
        type:Number,
        required:true,
      },
    phnumber: { 
        type: String, 
        required: true 
      },
  },

    user:{
      type:String,
      ref:"User",
      required:true,
    },

    subtotal:{
      type:Number,
      required:true,
    },
    tax:{
      type:Number,
      required:true,
    },
    shippingCharges:{
      type:Number,
      required:true,
    },
    discount:{
      type:Number,
      required:true,
    },
    total:{
      type:Number,
      required:true,
    },
    customOrderId: {
    type: String,
    default: null, // ✅ optional field
    },
    status:{
      type:String,
      enum:["Processing", "Shipped", "Delivered"],
      default:"Processing",
    },

    orderItems:[
      {
        name:String,
        photo:String,
        price:Number,
        quantity:Number,
        productId:{
          type: mongoose.Types.ObjectId,
          ref:"Product",
        },
      },
    ],
  },

  {
    timestamps:true,
  }
  );



export const Order = mongoose.model("Order",schema);




