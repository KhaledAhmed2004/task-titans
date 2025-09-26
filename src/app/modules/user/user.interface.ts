import { Model } from 'mongoose';
import { USER_ROLES, USER_STATUS } from '../../../enums/user';

export type IUser = {
  name: string;
  role: USER_ROLES;
  email: string;
  password: string;
  location: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  phone: string;
  image?: string;
  status: USER_STATUS;
  verified: boolean;
  deviceTokens?: string[];
  averageRating: number;
  ratingsCount: number;
  about?: string;
  googleId?: string;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number;
    expireAt: Date;
  };
};

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;

  addDeviceToken(userId: string, token: string): Promise<IUser | null>;
  removeDeviceToken(userId: string, token: string): Promise<IUser | null>;
} & Model<IUser>;
