import { Category } from './category.model';
import { ICategory } from './category.interface';
import { TaskModel } from '../task/task.model';

const createCategory = async (payload: ICategory) => {
  return await Category.create(payload);
};

const getAllCategories = async () => {
  return await Category.find();
};

const updateCategory = async (id: string, payload: Partial<ICategory>) => {
  return await Category.findByIdAndUpdate(id, payload, { new: true });
};

const deleteCategory = async (id: string) => {
  return await Category.findByIdAndDelete(id);
};

// const getTopCategoryThisMonth = async () => {
//   const now = new Date();
//   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

//   // Aggregate tasks created this month
//   const aggregation = await TaskModel.aggregate([
//     { 
//       $match: { createdAt: { $gte: startOfMonth } } // tasks from this month
//     },
//     { 
//       $group: { 
//         _id: '$taskCategory', 
//         count: { $sum: 1 } 
//       } 
//     },
//     { 
//       $sort: { count: -1 } // sort descending
//     },
//     {
//       $lookup: { // join with Category collection to get category name
//         from: 'categories', // collection name in MongoDB
//         localField: '_id',
//         foreignField: '_id',
//         as: 'category'
//       }
//     },
//     {
//       $unwind: '$category' // flatten the joined category
//     },
//   ]);

//   const totalTasksThisMonth = await TaskModel.countDocuments({ createdAt: { $gte: startOfMonth } });

//   // Calculate percentage
//   const resultWithPercentage = aggregation.map(item => ({
//     categoryId: item._id,
//     categoryName: item.category.name,
//     count: item.count,
//     percentage: totalTasksThisMonth ? ((item.count / totalTasksThisMonth) * 100).toFixed(2) : 0
//   }));

//   return resultWithPercentage;
// };

const getTopCategoryThisMonth = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Step 1: Get all categories
  const categories = await Category.find().lean();

  // Step 2: Count tasks per category this month
  const taskCounts = await TaskModel.aggregate([
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $group: { _id: '$taskCategory', count: { $sum: 1 } } }
  ]);

  // Convert taskCounts to a map for easy lookup
  const taskCountMap: Record<string, number> = {};
  taskCounts.forEach(tc => {
    taskCountMap[tc._id.toString()] = tc.count;
  });

  const totalTasksThisMonth = await TaskModel.countDocuments({ createdAt: { $gte: startOfMonth } });

  // Step 3: Build final result with 0% for categories with no tasks
  const resultWithPercentage = categories.map(cat => {
    const count = taskCountMap[cat._id.toString()] || 0;
    const percentage = totalTasksThisMonth ? ((count / totalTasksThisMonth) * 100).toFixed(2) : "0.00";
    return {
      categoryId: cat._id,
      categoryName: cat.name,
      count,
      percentage
    };
  });

  return resultWithPercentage;
};
export const CategoryService = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getTopCategoryThisMonth,
};
