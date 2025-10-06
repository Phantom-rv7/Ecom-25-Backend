import { NextFunction,Response,Request } from "express";
import { User } from "../models/user.js";
import { NewUserRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";
import admin from "firebase-admin";


// export const newUser = TryCatch(
//   async (
//     req:Request<{},{}>,
//     res:Response,
//     next:NextFunction
//  ) => {

//      const {name,email,photo,gender,_id,dob} = req.body; 

//      let user = await User.findById(_id);

//     if(user)
//     return res.status(200).json({
//       success:true,
//       message:`Welcome , ${user.name}`,
//     })

//     // if(!_id || !name || !email ||  !photo || !gender || !dob)
//     //   return next(new ErrorHandler("Please fill all the Fields",400));

//      user = await User.create({
//        name,
//        email,
//        photo,
//        gender,
//        _id,
//        dob:new Date(dob),
//      })

//      return res.status(201).json({
//        success:true,
//        message:`Welcome , ${user.name}`,
//      })

//    } 
//  );


export const newUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, photo, gender, _id, dob } = req.body;

    if (!_id || !name || !email || !photo) {
      return next(new ErrorHandler("Missing required fields", 400));
    }

    // Check if user exists by _id
    let user = await User.findById(_id);
    if (user) {
      return res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}`,
      });
    }

    // Check if email already exists (different UID)
    const emailUser = await User.findOne({ email });
    if (emailUser) {
      return next(new ErrorHandler("Email already exists", 400));
    }

    // Create new user
    user = await User.create({
      _id,
      name,
      email,
      photo,
      gender: gender || undefined,
      dob: dob ? new Date(dob) : undefined,
    });

    return res.status(201).json({
      success: true,
      message: `Welcome, ${user.name}`,
    });
  }
);

 export const getAllUsers = TryCatch (async (req,res,next) =>{

  const users = await User.find({});
  return res.status(201).json({
    success:true,
    users,
  })

 })

 export const getUser = TryCatch (async (req,res,next) =>{

  const id = req.params.id;
  const user = await User.findOne({ _id: id }); // ✅ use findOne;
  // const user = await User.findById(id);

  if(!user) return next(new ErrorHandler("Invalid ID",400))
  
  return res.status(201).json({
    success:true,
    user,
  })

 })



 export const deleteUser = TryCatch (async (req,res,next) =>{

  const id = req.params.id;
  const user = await User.findOne({ _id: id }); // ✅ use findOne
  // const user = await User.findById(id);

  if(!user) return next(new ErrorHandler("Invalid ID",400))

    await user.deleteOne();
  
  return res.status(201).json({
    success:true,
    message:"User Deleted Successfully",
  })

 })

// import { Request, Response, NextFunction } from "express";
// import { User } from "../models/user.js";
// import { NewUserRequestBody } from "../types/types.js";
// import ErrorHandler from "../utils/utility-class.js";
// import { TryCatch } from "../middlewares/error.js";

// // 🔐 Register a new user (Firebase UID-based)
// export const registerUser = TryCatch(
//   async (
//     req: Request<{}, {}, NewUserRequestBody>,
//     res: Response,
//     next: NextFunction
//   ) => {
//     const { name, photo, gender, dob, role } = req.body;
//     const { uid, email } = req.user!;

//     if (!name || !email || !photo || !gender || !dob || !role) {
//       return next(new ErrorHandler("Please fill all required fields", 400));
//     }

//     const existingUser = await User.findOne({ uid });
//     if (existingUser) {
//       return res.status(200).json({
//         success: true,
//         message: "User already registered",
//         user: existingUser,
//       });
//     }

//     const user = await User.create({
//       uid,
//       name,
//       email,
//       photo,
//       gender,
//       dob: new Date(dob),
//       role,
//     });

//     return res.status(201).json({
//       success: true,
//       message: `Welcome, ${user.name}`,
//       user,
//     });
//   }
// );

// // 🔑 Login is handled by Firebase — this route is optional
// export const loginUser = TryCatch(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { uid } = req.user!;
//     const user = await User.findOne({ uid });

//     if (!user) return next(new ErrorHandler("User not found", 404));

//     return res.status(200).json({
//       success: true,
//       message: `Welcome back, ${user.name}`,
//       user,
//     });
//   }
// );

// // 👥 Get all users
// export const getAllUsers = TryCatch(async (req: Request, res: Response) => {
//   const users = await User.find({});
//   return res.status(200).json({
//     success: true,
//     users,
//   });
// });

// // 👤 Get a single user
// export const getUser = TryCatch(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const id = req.params.id;
//     const user = await User.findById(id);
//     if (!user) return next(new ErrorHandler("Invalid ID", 400));

//     return res.status(200).json({
//       success: true,
//       user,
//     });
//   }
// );

// // 🗑️ Delete a user
// export const deleteUser = TryCatch(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const id = req.params.id;
//     const user = await User.findById(id);
//     if (!user) return next(new ErrorHandler("Invalid ID", 400));

//     await user.deleteOne();

//     return res.status(200).json({
//       success: true,
//       message: "User Deleted Successfully",
//     });
//   }
// );