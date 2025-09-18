// import { NextFunction, Request, Response } from 'express';
// import { StatusCodes } from 'http-status-codes';
// import { Secret } from 'jsonwebtoken';
// import config from '../../config';
// import ApiError from '../../errors/ApiError';
// import { jwtHelper } from '../../helpers/jwtHelper';

// const auth =
//   (...roles: string[]) =>
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const tokenWithBearer = req.headers.authorization;
//       if (!tokenWithBearer) {
//         throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
//       }

//       if (tokenWithBearer && tokenWithBearer.startsWith('Bearer')) {
//         const token = tokenWithBearer.split(' ')[1];

//         //verify token
//         const verifyUser = jwtHelper.verifyToken(
//           token,
//           config.jwt.jwt_secret as Secret
//         );
//         //set user to header
//         req.user = verifyUser;

//         //guard user
//         if (roles.length && !roles.includes(verifyUser.role)) {
//           throw new ApiError(
//             StatusCodes.FORBIDDEN,
//             "You don't have permission to access this api"
//           );
//         }

//         next();
//       }
//     } catch (error) {
//       next(error);
//     }
//   };

// export default auth;

import { NextFunction, Request, Response } from 'express'; 
import { StatusCodes } from 'http-status-codes'; 
import { Secret } from 'jsonwebtoken'; 
import config from '../../config'; 
import ApiError from '../../errors/ApiError'; 
import { jwtHelper } from '../../helpers/jwtHelper'; 
import { USER_ROLES } from '../../enums/user';

const auth = 
  (...roles: string[]) => 
  async (req: Request, res: Response, next: NextFunction) => { 
    try { 
      const tokenWithBearer = req.headers.authorization; 
      
      // If GUEST is allowed and no token provided, set user as guest
      if (!tokenWithBearer && roles.includes(USER_ROLES.GUEST)) {
        req.user = { role: USER_ROLES.GUEST, id: null, email: null }; // Set basic guest info
        return next();
      }
      
      // If no token and GUEST not allowed, throw error
      if (!tokenWithBearer) { 
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized'); 
      } 
 
      if (tokenWithBearer && tokenWithBearer.startsWith('Bearer')) { 
        const token = tokenWithBearer.split(' ')[1]; 
 
        //verify token 
        const verifyUser = jwtHelper.verifyToken( 
          token, 
          config.jwt.jwt_secret as Secret 
        ); 
        //set user to header 
        req.user = verifyUser; 
 
        //guard user 
        if (roles.length && !roles.includes(verifyUser.role)) { 
          throw new ApiError( 
            StatusCodes.FORBIDDEN, 
            "You don't have permission to access this api" 
          ); 
        } 
 
        next(); 
      } 
    } catch (error) { 
      next(error); 
    } 
  }; 
 
export default auth;