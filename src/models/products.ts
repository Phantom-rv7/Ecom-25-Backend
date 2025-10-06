import mongoose from "mongoose";


const schema =  new mongoose.Schema({
  name:{
    type:String,
    required:[true,"Please enter Name"],
  },
  photos:[{
    public_id:{
      type:String,
      required:[true,"Please enter Public ID"],
    },
    url:{
      type:String,
      required:[true,"Please enter url"],
    },
  }],
  price:{
    type:Number,
    required:[true,"Please enter Price"],
  },
  fakePrice:{
    type:Number,
    required:[true,"Please enter Fake Price"],
  },
  off:{
    type:Number,
    required:[true,"Please enter How much Off"],
  },
  stock:{
    type:Number,
    required:[true,"Please enter Stock"],
  },
  category:{
    type:String,
    required:[true,"Please enter Category"],
    trim:true,
  },
  color:{
    type:String,
    required:[true,"Please enter the Color"],
    trim:true,
  },
  pocket:{
    type:String,
    required:[true,"Please enter does it has Pocket or not"],
    trim:true,
  },
  gsm:{
    type:String,
    required:[true,"Please enter the gsm"],
    trim:true,
  },
  materialType:{
    type:String,
    required:[true,"Please enter which Material Type"]
  },
  genderType:{
    type:String,
    required:[true,"Please enter which for Which Gender"]
  },
   description:{
    type:String,
    required:[true,"Please enter Description"]
  }, 
  size:{
    type:String,
    required:[true,"Please enter availaible Sizes"]
  },
  ratings:{
    type:Number,
    default:0,
  },
  numOfReviews:{
    type:Number,
    default:0,
  },
  slug: {
  type: String,
  required: true,
  unique: true,
}
},{
  timestamps:true,
}
);



export const Product = mongoose.model("Product",schema);






