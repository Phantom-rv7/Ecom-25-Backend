import { resolveNaptr } from "dns";
import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/products.js";
import { User } from "../models/user.js";
import { calculatePercentage, getChartData, getInventories } from "../utils/feautures.js";

export const getDashboardStats = TryCatch(async(req, res, next) => {
  
  let stats = {};

  const key = "admin-stats";

  if(myCache.has("admin-stats"))
     stats = JSON.parse(myCache.get(key) as string )
    else{
      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const thisMonth = {
        start:new Date(today.getFullYear(),today.getMonth(), 1),
        end:today,
      }

      const lastMonth = {
        start:new Date(today.getFullYear(),today.getMonth() - 1, 1),
        end:new Date(today.getFullYear(),today.getMonth(), 0)
      }

      const thisMonthProductPromise =  Product.find({
        createdAt:{
          $gte:thisMonth.start,
          $lte:thisMonth.end,
        },
      })

      const lastMonthProductPromise =  Product.find({
        createdAt:{
          $gte:lastMonth.start,
          $lte:lastMonth.end,
        },
      })


      const thisMonthUserPromise =  User.find({
        createdAt:{
          $gte:thisMonth.start,
          $lte:thisMonth.end,
        },
      })

      const lastMonthUserPromise =  User.find({
        createdAt:{
          $gte:lastMonth.start,
          $lte:lastMonth.end,
        },
      })


      const thisMonthOrderrPromise =  Order.find({
        createdAt:{
          $gte:thisMonth.start,
          $lte:thisMonth.end,
        },
      })

      const lastMonthOrderPromise =  Order.find({
        createdAt:{
          $gte:lastMonth.start,
          $lte:lastMonth.end,
        },
      })

      const lastSixMonthOrderPromise =  Order.find({
        createdAt:{
          $gte:sixMonthsAgo,
          $lte:today,
        },
      })

      const latesTransactionPromise = Order.find({})
        .select(["orderItems","discount","total","status"])
        .limit(4);

      const [
        thisMonthProducts,
        thisMonthUsers,
        thisMonthOrders,
        lastMonthProducts,
        lastMonthUsers,
        lastMonthOrders,
        productsCount,
        userCount,
        allOrders,
        lastSixMonthOrder,
        categories,
        femaleUsersCount,
        latestTransaction,
      ] = await Promise.all([
        thisMonthProductPromise,
        thisMonthUserPromise,
        thisMonthOrderrPromise,
        lastMonthProductPromise,
        lastMonthUserPromise,
        lastMonthOrderPromise,
        Product.countDocuments(),
        User.countDocuments(),
        Order.find({}).select("total"),
        lastSixMonthOrderPromise,
        Product.distinct("category"),
        User.countDocuments({gender:"female"}),
        latesTransactionPromise,
      ])

      const thisMonthRevenue = thisMonthOrders.reduce(
        (total,order) => total + (order.total || 0), 0)

      const lastMonthRevenue = lastMonthOrders.reduce(
        (total,order) => total + (order.total || 0), 0)

      const changePercent = {
        revenue:calculatePercentage(thisMonthRevenue,lastMonthRevenue),
        product:calculatePercentage(
          thisMonthProducts.length,
          lastMonthProducts.length
        ),
        user:calculatePercentage(
          thisMonthUsers.length,
          lastMonthUsers.length
        ),
        order:calculatePercentage(
          thisMonthOrders.length,
          lastMonthOrders.length
        ),
      };

    const revenue = allOrders.reduce(
      (total,order) => total + (order.total || 0),0
    )

    const count = {
      revenue,
      product:productsCount,
      user:userCount,
      order:allOrders.length,
    }

    const orderMonthCounts = new Array(6).fill(0);
    const orderMonthlyRevenue = new Array(6).fill(0);

    lastSixMonthOrder.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

      if(monthDiff < 6){
        orderMonthCounts[6 - monthDiff - 1] += 1;
        orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
      }
    });

    const categoryCount = await getInventories({
      categories,
      productsCount,
    });

   

    const userRatio = {
      male:userCount - femaleUsersCount,
      female:femaleUsersCount,
    }

    const modifiedLatestTransaction = latestTransaction.map((i) => ({
      _id:i._id,
      discount:i.discount,
      amount:i.total,
      quantity:i.orderItems.length,
      status:i.status,
    }))

    stats = {
      categoryCount,
      changePercent,
      count,
      chart:{
        order:orderMonthCounts,
        revenue:orderMonthlyRevenue,
      },
      userRatio,
      latestTransaction:modifiedLatestTransaction,
    }

    myCache.set(key, JSON.stringify(stats));

    }


    return res.status(200).json({
      success:true,
      stats,
    })
})

export const getPieChart = TryCatch(async(req, res, next) => {

  let charts;
  const key = "admin-pie-charts";

  if(myCache.has(key))
    charts = JSON.parse(myCache.get(key) as string);

  else{

    const allOrderPromise =  Order.find({  }).select([
      "total",
      "discount",
      "subtotal",
      "tax",
      "shippingCharges",
    ])


    const [
      processingOrder,
      shippedOrder,
      deliverdOrder,
      categories,
      productsCount,
      outofStock,
      allOrders,
      allUsers,
      adminUsers,
      customUsers,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipping" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock:0 }),
      allOrderPromise,
      User.find({ }).select(["dob"]),
      User.countDocuments({role:"admin"}),
      User.countDocuments({role:"user"}),
    ]);

    const orderFullfillment = {
      processing:processingOrder,
      shipping:shippedOrder,
      delivered:deliverdOrder,
    }

    const productCategories = await getInventories({
      categories,
      productsCount,
    });

    const stockAvailability = {
      inStock:productsCount - outofStock,
      outofStock,
    }

    const grossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );

    const discount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );

    const productionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );

    const burnt = allOrders.reduce(
      (prev, order) => prev + (order.tax || 0),
      0
    );

    const marketingCost = Math.round(grossIncome * (30 / 100));

    const netMargin = grossIncome - discount - productionCost - burnt - marketingCost;


    const revenueDistribution = {
      netMargin,
      discount,
      productionCost,
      burnt,
      marketingCost,
    }

    const usersAgeGroup = {
      teen:allUsers.filter((i) => i.age < 20).length,
      adult:allUsers.filter((i) => i.age >=20 && i.age < 40).length,
      old: allUsers.filter((i) => i.age >= 40).length,
    }

    const adminCustomer = {
      admin:adminUsers,
      customer:customUsers,
    }
    
    charts = {
      orderFullfillment,
      productCategories,
      stockAvailability,
      revenueDistribution,
      usersAgeGroup,
      adminCustomer,
    }

    myCache.set(key, JSON.stringify(charts));
    
  }
  
  return res.status(200).json({
    success:true,
    charts,
  })

})

export const getBarChart = TryCatch(async(req,res,next) => {

  let charts;

  const key = "admin-bar-charts";

  if(myCache.has(key)) charts = JSON.parse(myCache.get(key) as string)

  else{

    const today = new Date();
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const sixMonthProductPromise =  Product.find({
      createdAt:{
        $gte:sixMonthsAgo,
        $lte:today,
      },
    }).select("createdAt")

    const sixMonthUserPromise =  User.find({
      createdAt:{
        $gte:sixMonthsAgo,
        $lte:today,
      },
    }).select("createdAt")

    const twelveMonthOrderPromise =  Order.find({
      createdAt:{
        $gte:twelveMonthsAgo,
        $lte:today,
      },
    }).select("createdAt")

    const [products,users,orders] = await Promise.all([
      sixMonthProductPromise,
      sixMonthUserPromise,
      twelveMonthOrderPromise,
    ]);


    const productsCounts = getChartData({ length:6, today, docArr:products})    
    const usersCounts = getChartData({ length:6, today, docArr:users });
    const ordersCounts = getChartData({length:12, today, docArr:orders})


    charts = {
      users: usersCounts,
      products: productsCounts,
      orders: ordersCounts,
    }

    myCache.set(key, JSON.stringify(charts))

  }

    return res.status(200).json({
      success:true,
      charts,
    })

    

})

export const getLineChart = TryCatch(async(req,res,next) => {
  let charts;

  const key = "admin-bar-charts";

  if(myCache.has(key)) charts = JSON.parse(myCache.get(key) as string)

  else{

    const today = new Date();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const baseQuery = {
      createdAt:{
        $gte:twelveMonthsAgo,
        $lte:today,
      },
    }


    const [products,users,orders] = await Promise.all([
      Product.find(baseQuery).select("createdAt"),
      User.find(baseQuery).select("createdAt"),
      Order.find(baseQuery).select(["createdAt", "discount", "total" ]),
    ]);


    const productsCounts = getChartData({length:6, today, docArr:products})    
    const usersCounts = getChartData({ length:12, today, docArr:users });
    const discount = getChartData({
      length:12,
      today,
      docArr:orders,
      property:"discount",
    })

    const revenue = getChartData({
      length:12,
      today,
      docArr:orders,
      property:"total",
    })

    
    charts = {
      users: usersCounts,
      products: productsCounts,
      discount,
      revenue,
    }

    myCache.set(key, JSON.stringify(charts))

  }

    return res.status(200).json({
      success:true,
      charts,
    })

})





// import { Request, Response, NextFunction } from "express";
// import { TryCatch } from "../middlewares/error.js";
// import ErrorHandler from "../utils/utility-class.js";
// import { Product } from "../models/products.js";
// import { User } from "../models/user.js";
// import { Order } from "../models/order.js";
// import { calculatePercentage, getChartData, getInventories } from "../utils/feautures.js";
// import { myCache } from "../app.js";


// export const getDashboardStats = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
//   const firebaseUid = req.user?.uid;

//   if (!firebaseUid) return next(new ErrorHandler("Unauthorized", 401));

//   const user = await User.findOne({ uid: firebaseUid });
//   if (!user || user.role !== "admin") {
//     return next(new ErrorHandler("Access denied", 403));
//   }

//   const key = "admin-stats";
//   let stats = {};

//   if (myCache.has(key)) {
//     stats = JSON.parse(myCache.get(key) as string);
//   } else {
//     const today = new Date();
//     const sixMonthsAgo = new Date();
//     sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

//     const thisMonth = {
//       start: new Date(today.getFullYear(), today.getMonth(), 1),
//       end: today,
//     };

//     const lastMonth = {
//       start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
//       end: new Date(today.getFullYear(), today.getMonth(), 0),
//     };

//     const [
//       thisMonthProducts,
//       thisMonthUsers,
//       thisMonthOrders,
//       lastMonthProducts,
//       lastMonthUsers,
//       lastMonthOrders,
//       productsCount,
//       userCount,
//       allOrders,
//       lastSixMonthOrder,
//       categories,
//       femaleUsersCount,
//       latestTransaction,
//     ] = await Promise.all([
//       Product.find({ createdAt: { $gte: thisMonth.start, $lte: thisMonth.end } }),
//       User.find({ createdAt: { $gte: thisMonth.start, $lte: thisMonth.end } }),
//       Order.find({ createdAt: { $gte: thisMonth.start, $lte: thisMonth.end } }),
//       Product.find({ createdAt: { $gte: lastMonth.start, $lte: lastMonth.end } }),
//       User.find({ createdAt: { $gte: lastMonth.start, $lte: lastMonth.end } }),
//       Order.find({ createdAt: { $gte: lastMonth.start, $lte: lastMonth.end } }),
//       Product.countDocuments(),
//       User.countDocuments(),
//       Order.find({}).select("total"),
//       Order.find({ createdAt: { $gte: sixMonthsAgo, $lte: today } }),
//       Product.distinct("category"),
//       User.countDocuments({ gender: "female" }),
//       Order.find({}).select(["orderItems", "discount", "total", "status"]).limit(4),
//     ]);

//     const thisMonthRevenue = thisMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
//     const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0);

//     const changePercent = {
//       revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
//       product: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
//       user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
//       order: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length),
//     };

//     const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0);

//     const count = {
//       revenue,
//       product: productsCount,
//       user: userCount,
//       order: allOrders.length,
//     };

//     const orderMonthCounts = new Array(6).fill(0);
//     const orderMonthlyRevenue = new Array(6).fill(0);

//     lastSixMonthOrder.forEach((order) => {
//       const creationDate = order.createdAt;
//       const monthDiff =
//         (today.getFullYear() - creationDate.getFullYear()) * 12 +
//         (today.getMonth() - creationDate.getMonth());

//       if (monthDiff < 6) {
//         orderMonthCounts[6 - monthDiff - 1] += 1;
//         orderMonthlyRevenue[6 - monthDiff - 1] += order.total || 0;
//       }
//     });

//     const categoryCount = await getInventories({ categories, productsCount });

//     const userRatio = {
//       male: userCount - femaleUsersCount,
//       female: femaleUsersCount,
//     };

//     const modifiedLatestTransaction = latestTransaction.map((i) => ({
//       _id: i._id,
//       discount: i.discount,
//       amount: i.total,
//       quantity: i.orderItems.length,
//       status: i.status,
//     }));

//     stats = {
//       categoryCount,
//       changePercent,
//       count,
//       chart: {
//         order: orderMonthCounts,
//         revenue: orderMonthlyRevenue,
//       },
//       userRatio,
//       latestTransaction: modifiedLatestTransaction,
//     };

//     myCache.set(key, JSON.stringify(stats));
//   }

//   return res.status(200).json({
//     success: true,
//     stats,
//   });
// });




//   // export const getDashboardStats = TryCatch(async(req, res, next) => {
    
//   //   let stats = {};

//   //   const key = "admin-stats";

//   //   if(myCache.has("admin-stats"))
//   //      stats = JSON.parse(myCache.get(key) as string )
//   //     else{
//   //       const today = new Date();
//   //       const sixMonthsAgo = new Date();
//   //       sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

//   //       const thisMonth = {
//   //         start:new Date(today.getFullYear(),today.getMonth(), 1),
//   //         end:today,
//   //       }

//   //       const lastMonth = {
//   //         start:new Date(today.getFullYear(),today.getMonth() - 1, 1),
//   //         end:new Date(today.getFullYear(),today.getMonth(), 0)
//   //       }

//   //       const thisMonthProductPromise =  Product.find({
//   //         createdAt:{
//   //           $gte:thisMonth.start,
//   //           $lte:thisMonth.end,
//   //         },
//   //       })

//   //       const lastMonthProductPromise =  Product.find({
//   //         createdAt:{
//   //           $gte:lastMonth.start,
//   //           $lte:lastMonth.end,
//   //         },
//   //       })


//   //       const thisMonthUserPromise =  User.find({
//   //         createdAt:{
//   //           $gte:thisMonth.start,
//   //           $lte:thisMonth.end,
//   //         },
//   //       })

//   //       const lastMonthUserPromise =  User.find({
//   //         createdAt:{
//   //           $gte:lastMonth.start,
//   //           $lte:lastMonth.end,
//   //         },
//   //       })


//   //       const thisMonthOrderrPromise =  Order.find({
//   //         createdAt:{
//   //           $gte:thisMonth.start,
//   //           $lte:thisMonth.end,
//   //         },
//   //       })

//   //       const lastMonthOrderPromise =  Order.find({
//   //         createdAt:{
//   //           $gte:lastMonth.start,
//   //           $lte:lastMonth.end,
//   //         },
//   //       })

//   //       const lastSixMonthOrderPromise =  Order.find({
//   //         createdAt:{
//   //           $gte:sixMonthsAgo,
//   //           $lte:today,
//   //         },
//   //       })

//   //       const latesTransactionPromise = Order.find({})
//   //         .select(["orderItems","discount","total","status"])
//   //         .limit(4);

//   //       const [
//   //         thisMonthProducts,
//   //         thisMonthUsers,
//   //         thisMonthOrders,
//   //         lastMonthProducts,
//   //         lastMonthUsers,
//   //         lastMonthOrders,
//   //         productsCount,
//   //         userCount,
//   //         allOrders,
//   //         lastSixMonthOrder,
//   //         categories,
//   //         femaleUsersCount,
//   //         latestTransaction,
//   //       ] = await Promise.all([
//   //         thisMonthProductPromise,
//   //         thisMonthUserPromise,
//   //         thisMonthOrderrPromise,
//   //         lastMonthProductPromise,
//   //         lastMonthUserPromise,
//   //         lastMonthOrderPromise,
//   //         Product.countDocuments(),
//   //         User.countDocuments(),
//   //         Order.find({}).select("total"),
//   //         lastSixMonthOrderPromise,
//   //         Product.distinct("category"),
//   //         User.countDocuments({gender:"female"}),
//   //         latesTransactionPromise,
//   //       ])

//   //       const thisMonthRevenue = thisMonthOrders.reduce(
//   //         (total,order) => total + (order.total || 0), 0)

//   //       const lastMonthRevenue = lastMonthOrders.reduce(
//   //         (total,order) => total + (order.total || 0), 0)

//   //       const changePercent = {
//   //         revenue:calculatePercentage(thisMonthRevenue,lastMonthRevenue),
//   //         product:calculatePercentage(
//   //           thisMonthProducts.length,
//   //           lastMonthProducts.length
//   //         ),
//   //         user:calculatePercentage(
//   //           thisMonthUsers.length,
//   //           lastMonthUsers.length
//   //         ),
//   //         order:calculatePercentage(
//   //           thisMonthOrders.length,
//   //           lastMonthOrders.length
//   //         ),
//   //       };

//   //     const revenue = allOrders.reduce(
//   //       (total,order) => total + (order.total || 0),0
//   //     )

//   //     const count = {
//   //       revenue,
//   //       product:productsCount,
//   //       user:userCount,
//   //       order:allOrders.length,
//   //     }

//   //     const orderMonthCounts = new Array(6).fill(0);
//   //     const orderMonthlyRevenue = new Array(6).fill(0);

//   //     lastSixMonthOrder.forEach((order) => {
//   //       const creationDate = order.createdAt;
//   //       const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

//   //       if(monthDiff < 6){
//   //         orderMonthCounts[6 - monthDiff - 1] += 1;
//   //         orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
//   //       }
//   //     });

//   //     const categoryCount = await getInventories({
//   //       categories,
//   //       productsCount,
//   //     });

    

//   //     const userRatio = {
//   //       male:userCount - femaleUsersCount,
//   //       female:femaleUsersCount,
//   //     }

//   //     const modifiedLatestTransaction = latestTransaction.map((i) => ({
//   //       _id:i._id,
//   //       discount:i.discount,
//   //       amount:i.total,
//   //       quantity:i.orderItems.length,
//   //       status:i.status,
//   //     }))

//   //     stats = {
//   //       categoryCount,
//   //       changePercent,
//   //       count,
//   //       chart:{
//   //         order:orderMonthCounts,
//   //         revenue:orderMonthlyRevenue,
//   //       },
//   //       userRatio,
//   //       latestTransaction:modifiedLatestTransaction,
//   //     }

//   //     myCache.set(key, JSON.stringify(stats));

//   //     }


//   //     return res.status(200).json({
//   //       success:true,
//   //       stats,
//   //     })
//   // })

//   export const getPieChart = TryCatch(async(req, res, next) => {

//     let charts;
//     const key = "admin-pie-charts";

//     if(myCache.has(key))
//       charts = JSON.parse(myCache.get(key) as string);

//     else{

//       const allOrderPromise =  Order.find({  }).select([
//         "total",
//         "discount",
//         "subtotal",
//         "tax",
//         "shippingCharges",
//       ])


//       const [
//         processingOrder,
//         shippedOrder,
//         deliverdOrder,
//         categories,
//         productsCount,
//         outofStock,
//         allOrders,
//         allUsers,
//         adminUsers,
//         customUsers,
//       ] = await Promise.all([
//         Order.countDocuments({ status: "Processing" }),
//         Order.countDocuments({ status: "Shipping" }),
//         Order.countDocuments({ status: "Delivered" }),
//         Product.distinct("category"),
//         Product.countDocuments(),
//         Product.countDocuments({ stock:0 }),
//         allOrderPromise,
//         User.find({ }).select(["dob"]),
//         User.countDocuments({role:"admin"}),
//         User.countDocuments({role:"user"}),
//       ]);

//       const orderFullfillment = {
//         processing:processingOrder,
//         shipping:shippedOrder,
//         delivered:deliverdOrder,
//       }

//       const productCategories = await getInventories({
//         categories,
//         productsCount,
//       });

//       const stockAvailability = {
//         inStock:productsCount - outofStock,
//         outofStock,
//       }

//       const grossIncome = allOrders.reduce(
//         (prev, order) => prev + (order.total || 0),
//         0
//       );

//       const discount = allOrders.reduce(
//         (prev, order) => prev + (order.discount || 0),
//         0
//       );

//       const productionCost = allOrders.reduce(
//         (prev, order) => prev + (order.shippingCharges || 0),
//         0
//       );

//       const burnt = allOrders.reduce(
//         (prev, order) => prev + (order.tax || 0),
//         0
//       );

//       const marketingCost = Math.round(grossIncome * (30 / 100));

//       const netMargin = grossIncome - discount - productionCost - burnt - marketingCost;


//       const revenueDistribution = {
//         netMargin,
//         discount,
//         productionCost,
//         burnt,
//         marketingCost,
//       }

//       const usersAgeGroup = {
//         teen:allUsers.filter((i) => i.age < 20).length,
//         adult:allUsers.filter((i) => i.age >=20 && i.age < 40).length,
//         old: allUsers.filter((i) => i.age >= 40).length,
//       }

//       const adminCustomer = {
//         admin:adminUsers,
//         customer:customUsers,
//       }
      
//       charts = {
//         orderFullfillment,
//         productCategories,
//         stockAvailability,
//         revenueDistribution,
//         usersAgeGroup,
//         adminCustomer,
//       }

//       myCache.set(key, JSON.stringify(charts));
      
//     }
    
//     return res.status(200).json({
//       success:true,
//       charts,
//     })

//   })

//   export const getBarChart = TryCatch(async(req,res,next) => {

//     let charts;

//     const key = "admin-bar-charts";

//     if(myCache.has(key)) charts = JSON.parse(myCache.get(key) as string)

//     else{

//       const today = new Date();
      
//       const sixMonthsAgo = new Date();
//       sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

//       const twelveMonthsAgo = new Date();
//       twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

//       const sixMonthProductPromise =  Product.find({
//         createdAt:{
//           $gte:sixMonthsAgo,
//           $lte:today,
//         },
//       }).select("createdAt")

//       const sixMonthUserPromise =  User.find({
//         createdAt:{
//           $gte:sixMonthsAgo,
//           $lte:today,
//         },
//       }).select("createdAt")

//       const twelveMonthOrderPromise =  Order.find({
//         createdAt:{
//           $gte:twelveMonthsAgo,
//           $lte:today,
//         },
//       }).select("createdAt")

//       const [products,users,orders] = await Promise.all([
//         sixMonthProductPromise,
//         sixMonthUserPromise,
//         twelveMonthOrderPromise,
//       ]);


//       const productsCounts = getChartData({ length:6, today, docArr:products})    
//       const usersCounts = getChartData({ length:6, today, docArr:users });
//       const ordersCounts = getChartData({length:12, today, docArr:orders})


//       charts = {
//         users: usersCounts,
//         products: productsCounts,
//         orders: ordersCounts,
//       }

//       myCache.set(key, JSON.stringify(charts))

//     }

//       return res.status(200).json({
//         success:true,
//         charts,
//       })

      

//   })

//   export const getLineChart = TryCatch(async(req,res,next) => {
//     let charts;

//     const key = "admin-bar-charts";

//     if(myCache.has(key)) charts = JSON.parse(myCache.get(key) as string)

//     else{

//       const today = new Date();

//       const twelveMonthsAgo = new Date();
//       twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

//       const baseQuery = {
//         createdAt:{
//           $gte:twelveMonthsAgo,
//           $lte:today,
//         },
//       }


//       const [products,users,orders] = await Promise.all([
//         Product.find(baseQuery).select("createdAt"),
//         User.find(baseQuery).select("createdAt"),
//         Order.find(baseQuery).select(["createdAt", "discount", "total" ]),
//       ]);


//       const productsCounts = getChartData({length:6, today, docArr:products})    
//       const usersCounts = getChartData({ length:12, today, docArr:users });
//       const discount = getChartData({
//         length:12,
//         today,
//         docArr:orders,
//         property:"discount",
//       })

//       const revenue = getChartData({
//         length:12,
//         today,
//         docArr:orders,
//         property:"total",
//       })

      
//       charts = {
//         users: usersCounts,
//         products: productsCounts,
//         discount,
//         revenue,
//       }

//       myCache.set(key, JSON.stringify(charts))

//     }

//       return res.status(200).json({
//         success:true,
//         charts,
//       })

//   })