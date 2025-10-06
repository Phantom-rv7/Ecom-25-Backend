// import multer from "multer";
// import { v4 as uuid} from "uuid"

// // multer().single("file")

// const storage = multer.diskStorage({

//   destination(req,file,callback){
//     callback(null,"uploads")
//   },
//   filename(req,file,callback){
//     const id = uuid();
//     const extName = file.originalname.split(".").pop();
//     callback(null,`${id}.${extName}`)
//   },
// })

// export const singleUpload = multer({storage}).single("photo");



import multer from "multer";


// export const singleUpload = multer({storage}).single("photo");
export const singleUpload = multer().single("photo");
export const multiUpload =  multer().array("photos",10);















