import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { TaskRoutes } from '../app/modules/task/task.route';
import { BidRoutes } from '../app/modules/bid/bid.route';
import { RatingRoutes } from '../app/modules/rating/rating.route';
const router = express.Router();

const apiRoutes = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/tasks',
    route: TaskRoutes,
  },
  {
    path: '/bids',
    route: BidRoutes,
  },
  {
    path: '/ratings',
    route: RatingRoutes,
  },
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
