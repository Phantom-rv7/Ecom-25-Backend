import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import mongoose, { Document } from 'mongoose';
import { myCache } from '../app.js';
import { Product } from '../models/products.js';
import { Review } from '../models/review.js';
import { InvalidateCacheProps, OrderItemType } from '../types/types.js';

// 📦 Connect to MongoDB
export const connectDB = (mongoURI: string) => {
  mongoose
    .connect(mongoURI, { dbName: 'Ecommerce_24' })
    .then((c) => console.log(`✅ DB connected to ${c.connection.host}`))
    .catch((e) => console.error('❌ MongoDB connection error:', e));
};

// 🧹 Invalidate cache keys
export const invalidatesCache = ({
  product,
  order,
  admin,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      'latest-products',
      'categories',
      'all-products',
    ];

    if (typeof productId === 'string') {
      productKeys.push(`product-${productId}`);
    } else if (Array.isArray(productId)) {
      productId.forEach((id) => productKeys.push(`product-${id}`));
    }

    myCache.del(productKeys);
    
  }

  if (order) {
    const orderKeys: string[] = ['all-orders'];

    if (userId) orderKeys.push(`my-orders-${userId}`);
    if (orderId) orderKeys.push(`order-${orderId}`);

    myCache.del(orderKeys);
  }

  if (admin) {
    const adminKeys = [
      'admin-stats',
      'admin-pie-charts',
      'admin-bar-charts',
    ];
    myCache.del(adminKeys);
    
  }
};

// 📉 Reduce stock after order
export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productId);
    if (!product) throw new Error('Product Not Found');
    product.stock = order.quantity;
    await product.save();
  }
};

// 📊 Calculate percentage change
export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

// 📦 Get inventory distribution by category
export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });

  return categoryCount;
};

// 📈 Get chart data for analytics
interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}

type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: 'discount' | 'total';
};

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += i[property]!;
      } else {
        data[length - monthDiff - 1] += 1;
      }
    }
  });

  return data;
};

// ⭐ Calculate average ratings
export const findAvgRatings = async (
  productId: mongoose.Types.ObjectId
) => {
  let totalRating = 0;
  const reviews = await Review.find({ product: productId });

  reviews.forEach((review) => {
    totalRating += review.rating;
  });

  const avgRating = Math.floor(totalRating / reviews.length) || 0;

  return {
    numOfReviews: reviews.length,
    ratings: avgRating,
  };
};

// ☁️ Upload images to Cloudinary
const getBase64 = (file: Express.Multer.File) =>
  `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

export const uploadToCloudinary = async (
  files: Express.Multer.File[]
) => {
  const promises = files.map(
    (file) =>
      new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader.upload(getBase64(file), (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        });
      })
  );

  const result = await Promise.all(promises);

  return result.map((i) => ({
    public_id: i.public_id,
    url: i.secure_url,
  }));
};

// 🗑️ Delete images from Cloudinary
export const deleteFromCloudinary = async (publicIds: string[]) => {
  const promises = publicIds.map(
    (id) =>
      new Promise<void>((resolve, reject) => {
        cloudinary.uploader.destroy(id, (error, result) => {
          if (error) return reject(error);
          resolve();
        });
      })
  );

  await Promise.all(promises);
};
