import { NextFunction, Request, Response } from "express";

export interface NewUserRequestBody{
  name:string;
  email:string;
  photo:string;
  gender:string;
  _id:string;
  dob:Date;
}


export type ControllerType = (
  req:Request<any>,
  // req: Request <{}, {}, NewUserRequestBody>,
  res: Response,
  next:NextFunction
 ) => Promise<void | Response<any, Record<string, any>>>


 export type SearchRequestQuery = {
  search?:string;
  price?:string;
  category?:string;
  sort?:string;
  page?:string;
  genderType?:string;
 }


 export interface BaseQuery{
  name?:{
    $regex:string;
    $options:string;
  };
  price?:{
    $lte:number;
  };
  category?:string;
  genderType?: string; // ✅ Add this line
 }


 export type InvalidateCacheProps = {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  userId?:string;
  orderId?:string;
  productId?:string | string[];
 }

 export type OrderItemType = {
  name:string;
  photo:string;
  price:number;
  quantity:number;
  productId:string;
 }

 export type ShippingInfoType = {
  address:string;
  city:string;
  state:string;
  phnumber:string;
  pinCode:number;
 }

//  export interface NewOrderRequestBody{
//   shippingInfo:ShippingInfoType;
//   user:string;
//   subtotal:string;
//   tax:number;
//   shippingCharges:number;
//   discount:number;
//   total:number;
//   orderItems:OrderItemType[];
//  }

// import { NextFunction, Request, Response } from "express";

// // 🔐 Firebase-authenticated request type
// export interface AuthenticatedRequest extends Request {
//   user: {
//     uid: string;
//     email: string;
//     role: "admin" | "user";
//   };
// }

// // 🧼 Firebase UID-based registration
// export interface NewUserRequestBody {
//   name: string;
//   email: string;
//   photo: string;
//   gender: "male" | "female" | "other";
//   dob: string | Date;
//   role: "admin" | "user";
// }

// // 🧼 Login is handled by Firebase — optional type
// export interface LoginRequestBody {
//   email: string;
// }

// // 🛍️ Product creation
export interface NewProductRequestBody {
  name: string;
  category: string;
  price: number;
  stock: number;
  materialType: string;
  description: string;
  size: string;
  fakePrice: number;
  off: number;
  color: string;
  pocket: string;
  gsm: string;
  genderType:string;
}

// // 🧠 Generic controller type
// export type ControllerType = (
//   req: Request<any>,
//   res: Response,
//   next: NextFunction
// ) => Promise<void | Response<any, Record<string, any>>>;

// // 🔍 Search query
// export type SearchRequestQuery = {
//   search?: string;
//   price?: string;
//   category?: string;
//   sort?: string;
//   page?: string;
// };

// // 🔍 Mongo query builder
// export interface BaseQuery {
//   name?: {
//     $regex: string;
//     $options: string;
//   };
//   price?: {
//     $lte: number;
//   };
//   category?: string;
// }

// // 🧹 Cache invalidation
// export type InvalidateCacheProps = {
//   product?: boolean;
//   order?: boolean;
//   admin?: boolean;
//   userId?: string; // Firebase UID
//   orderId?: string;
//   productId?: string | string[];
// };

// // 📦 Order item
// export type OrderItemType = {
//   name: string;
//   photo: string;
//   price: number;
//   quantity: number;
//   productId: string;
// };

// // 🚚 Shipping info
// export type ShippingInfoType = {
//   address: string;
//   city: string;
//   state: string;
//   phnumber: number;
//   pinCode: number;
// };

// // 🧾 New order payload (UID comes from req.user)
export interface NewOrderRequestBody {
  shippingInfo: ShippingInfoType;
  subtotal: string;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  selectedSize: string;
  orderItems: OrderItemType[];
  user:string;
}

