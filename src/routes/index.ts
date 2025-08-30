import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { TaskRoutes } from '../app/modules/task/task.route';
import { BidRoutes } from '../app/modules/bid/bid.route';
import { RatingRoutes } from '../app/modules/rating/rating.route';
import { ReportRoutes } from '../app/modules/report/report.route';
import { FaqRoutes } from '../app/modules/faq/faq.route';
import { ChatRoutes } from '../app/modules/chat/chat.route';
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
  {
    path: '/reports',
    route: ReportRoutes,
  },
  {
    path: '/faqs',
    route: FaqRoutes,
  },
  {
    path: '/chats',
    route: ChatRoutes,
  }
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
