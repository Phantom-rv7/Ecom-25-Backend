import mongoose, { Schema } from "mongoose";

const schema = new mongoose.Schema({

  comment:{
    type:String,
    maxlength:[250, "Comment must not be More than 250 characters"],
  },
  rating:{
    type:Number,
    required:[true, "Please give Rating"],
    min:[1,"Rating must be atleast 1"],
    max:[5,"Rating Cannot be More than 5"],
  },
  user:{
    type:String,
    ref:"User",
    required:true,
  },
  product:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Product",
    required:true,
  },
},
  {timestamps:true}
)

export const Review = mongoose.model("Review", schema)