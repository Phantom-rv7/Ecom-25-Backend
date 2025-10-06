import { Request } from "express";
import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/products.js";
import { Review } from "../models/review.js";
import { User } from "../models/user.js";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import { deleteFromCloudinary, findAvgRatings, invalidatesCache, uploadToCloudinary } from "../utils/feautures.js";
import ErrorHandler from "../utils/utility-class.js";
import slugifyLib from "slugify";
const slugify = slugifyLib.default;



export const getlatestProducts = TryCatch( async(req , res , next ) => {

  let products ;

  if(myCache.has("latest-products")) 
    products = JSON.parse(myCache.get("latest-products") as string)
  else{
       products = await Product.find({}).sort({createdAt: -1}).limit(10);
       myCache.set("latest-products",JSON.stringify(products))
  }

  const cachedData = myCache.get("latest-products");
if (cachedData) {
  try {
    const parsedData = JSON.parse(cachedData as string);
    
  } catch {
    
  }
}


    return res.status(200).json({
      success:true,
      products,
    })  
}) 



export const getAllCategories = TryCatch( async(req , res , next ) => {

    let categories;
     
    if(myCache.has("categories"))
      categories = JSON.parse(myCache.get("categories") as string)
    else{
       categories = await Product.distinct("category");
      myCache.set("categories", JSON.stringify(categories))
      
    }
  

    return res.status(200).json({
      success:true,
      categories,
    })
}) 



export const getAdminProducts = TryCatch( async(req , res , next ) => {

  let products;

  if(myCache.has("all-products"))
    products = JSON.parse(myCache.get("all-products") as string)
  else{
      products = await Product.find({})
      myCache.set("all-products", JSON.stringify(products))
  }
  

  return res.status(200).json({
    success:true,
    products,
  })
}) 



export const getSingleProduct = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  let product;

  // Check cache first
  if (myCache.has(`product-${id}`)) {
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  } else {
    product = await Product.findById(id);

    // If product not found, return 404
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Cache the product
    myCache.set(`product-${id}`, JSON.stringify(product));
  }

  return res.status(200).json({
    success: true,
    product,
  });
})



export const newProduct = TryCatch(
  async(req: Request<{}, {}, NewProductRequestBody>, res , next ) => {
    const {name, price, stock, category, materialType, description, size, fakePrice, off, color, pocket, gsm, genderType} = req.body;
    const photos = req.files as Express.Multer.File[] | undefined;

    if(!photos) return next(new ErrorHandler("Please Add Photos",400))
      
    if(photos.length < 1)
      return next(new ErrorHandler("Please Add alteast one Photos",400))

    if(photos.length > 10)
      return next(new ErrorHandler("Cannot  Add more than 10 Photos",400))
    
    if( !name || !price || !stock || !category || !materialType || !size || !description  || !off || !fakePrice || !color || !pocket || !gsm || !genderType ) 
      return next(new ErrorHandler("Please Enter All Fields",400))

    //Upload Here
  const photosURL =  await uploadToCloudinary(photos);

  
  
  const slugBase = slugify(name, { lower: true, strict: true });
  const uniqueSuffix = Date.now().toString(36);
  const slug = `${slugBase}-${uniqueSuffix}`;

   const product =  await Product.create({
      name,
      price,
      slug,
      stock,
      materialType,
      description,
      size,
      off,
      color,
      genderType,
      pocket,
      gsm,
      fakePrice,
      category:category.toLowerCase(),
      photos:photosURL,
    })

    invalidatesCache({
      product:true, 
      admin: true, 
    })

    return res.status(201).json({
      success:true,
      message:"Product Created Successfully",
      productUrl: `/product/${product.slug}`,
    })
})



export const updateProduct = TryCatch(async(req, res , next ) => {

    const { id } = req.params;
    const {name, price, stock, category, materialType, description, size , fakePrice, off, color, pocket, gsm, genderType } = req.body;
    const photos = req.files as Express.Multer.File[] | undefined;

    const product = await Product.findById(id); 

    if(!product) return next(new ErrorHandler("Product not Found",404));
    
        if (photos && photos.length > 0) {
      const photosURL = await uploadToCloudinary(photos);

      const ids = product.photos.map((photo) => photo.public_id);
      await deleteFromCloudinary(ids);

      // Clear existing photos
      product.photos.splice(0, product.photos.length);

      // Push new photos as subdocuments
      photosURL.forEach((photo) => {
        product.photos.push(photo); // Mongoose will wrap this as a subdocument
      });

    }

    if(name) product.name = name;
    if(price) product.price = price;
    if(fakePrice) product.fakePrice = fakePrice;
    if(off) product.off = off;
    if(stock) product.stock = stock;
    if(category) product.category = category;
    if(materialType) product.materialType = materialType;
    if(description) product.description= description;
    if(size) product.size = size;
    if(color) product.color = color;
    if(pocket) product.pocket = pocket;
    if(gsm) product.gsm = gsm;
    if(genderType) product.genderType = genderType;

    await product.save();

    invalidatesCache({
      product:true, 
      productId:String (product._id),
      admin: true,
    })
    return res.status(200).json({
      success:true,
      message:"Product Updated Successfully",
    })
})



export const deleteProduct = TryCatch( async(req , res , next ) => {
  
  const product = await Product.findById(req.params.id)
  if(!product) return next(new ErrorHandler("Invalid Product Id / Product not Found",404))

  const ids = product.photos.map((photo) => photo.public_id)  
  await deleteFromCloudinary(ids);

  await product.deleteOne()

  invalidatesCache({
    product:true, 
    productId:String (product._id),
    admin: true,
  })

  return res.status(200).json({
    success:true,
    message:"Product Deleted Successfully"
  })
}) 



export const getAllProducts = TryCatch( async(req:Request<{}, {},{},SearchRequestQuery> , res , next ) => {

  const {search,sort,category,price,genderType} = req.query;
  const page = Number(req.query.page) || 1;

  const limit = Number(process.env.PRODUCT_PER_PAGE) || 10;
  const skip = (page - 1) * limit;

  const baseQuery:BaseQuery = {}

  if(search) baseQuery.name = {
    $regex:search,
    $options:"i"
  };

  if(price) baseQuery.price = {
      $lte:Number(price),
  };

  if (genderType) baseQuery.genderType = genderType.toLowerCase();

  if(category) baseQuery.category = category;

  const productPromise =  Product.find(baseQuery)
    .sort(sort && { price:sort === "asc" ? 1 : -1 } )
    .limit(limit)
    .skip(skip);

  const [products, filteredOnlyProduct] = await Promise.all([
    productPromise,
     Product.find(baseQuery),
  ])

 
  const totalPage = Math.ceil(filteredOnlyProduct.length / limit);
  

    return res.status(200).json({
      success:true,
      products,
      totalPage,
    })
}) 



//Review

export const allReviewsOfProducts = TryCatch( async(req , res , next ) => {

  const reviews = await Review.find({
    product:req.params.id,
  })
  .populate("user", "name photo")
  .sort({updatedAt: -1}) ;

  return res.status(200).json({
    success:true,
    reviews,
  })
})

export const newReview = TryCatch( async(req , res , next ) => {

  const user = await User.findById(req.query.id); 
  if(!user) return next(new ErrorHandler("User Not Logged In",404));
  
  const product = await Product.findById(req.params.id)
  if(!product) return next(new ErrorHandler("Product not Found",404))

  const {comment, rating} = req.body;

  const alreadyReviewed = await Review.findOne({
      user:user._id,
      product:product._id,
  })  

   if(alreadyReviewed){
    alreadyReviewed.comment = comment;
    alreadyReviewed.rating = rating;

    await alreadyReviewed.save();
  }
  else{ 
    await Review.create({
      comment,
      rating,
      user:user._id,
      product:product._id,
    })
  }

  const {ratings,numOfReviews} = await findAvgRatings(product._id);

  product.ratings = ratings;
  product.numOfReviews = numOfReviews;

  invalidatesCache({
    product:true, 
    productId:String (product._id),
    admin: true,
  })

  return res.status(alreadyReviewed ? 200 : 201).json({
    success:true,
    message:alreadyReviewed ? "Review Updated" : "Review Added",
  })
}) 


export const deleteReview = TryCatch( async(req , res , next ) => {

  const user = await User.findById(req.query.id); 
  if(!user) return next(new ErrorHandler("User Not Logged In",404));
  
  const review = await Review.findById(req.params.id)
  if(!review) return next(new ErrorHandler("Review not Found",404))

  const isAuthenticUser = review.user.toString() === user._id.toString();

  if(!isAuthenticUser) return next(new ErrorHandler("Not Authorized", 401));
  
  await review.deleteOne();

  const product = await Product.findById(review.product);
  if(!product) return next(new ErrorHandler("Product Not Found", 404));

  const {ratings,numOfReviews} = await findAvgRatings(product._id);

  product.ratings = ratings;
  product.numOfReviews = numOfReviews;

  await product.save();

  invalidatesCache({
    product:true, 
    productId:String (product._id),
    admin: true,
  })

  return res.status(200).json({
    success:true,
    message:"Review Deleted",
  })
}) 

