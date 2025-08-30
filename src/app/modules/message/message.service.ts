import { JwtPayload } from 'jsonwebtoken';
import { IMessage } from './message.interface';
import { Message } from './message.model';
import { Chat } from '../chat/chat.model';
import mongoose from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import QueryBuilder from '../../builder/QueryBuilder';

const sendMessageToDB = async (payload: any): Promise<IMessage> => {
  // save to DB
  const response = await Message.create(payload);

  //@ts-ignore
  const io = global.io;
  if (io) {
    io.emit(`getMessage::${payload?.chatId}`, response);
  }

  return response;
};

const getMessageFromDB = async (
  user: JwtPayload,
  id: any,
  query: Record<string, any>
): Promise<{ messages: IMessage[]; pagination: any; participant: any }> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Chat ID');
  }

  // ✅ use new QueryBuilder with chaining
  const queryBuilder = new QueryBuilder(Message.find({ chatId: id }), query)
    .search(['text']) // search by text field (you can add more searchable fields if needed)
    .filter()
    .sort()
    .paginate()
    .fields();

  const messages = await queryBuilder.modelQuery;
  const pagination = await queryBuilder.getPaginationInfo();

  const participant: any = await Chat.findById(id).populate({
    path: 'participants',
    select: 'name profile location',
    match: {
      _id: { $ne: user.id }, // exclude the logged-in user
    },
  });

  return {
    messages,
    pagination,
    participant: participant?.participants[0],
  };
};

export const MessageService = { sendMessageToDB, getMessageFromDB };
