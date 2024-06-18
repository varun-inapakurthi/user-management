import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/User.schema';
import { CreateUserDto } from './dto/CreateUser.dto';

import * as jwt from 'jsonwebtoken';
import { Block } from 'src/schemas/Block.schema';
import { Types } from 'mongoose';
import Redis from 'ioredis';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  private readonly jwtSecret: string;
  private readonly redis: Redis;
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Block.name) private blockModel: Model<Block>,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') || 'secret_key';
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: Number(this.configService.get<string>('REDIS_PORT')) || 6379,
      password: this.configService.get<string>('REDIS_PASSWORD') || null,
    });
  }

  /**
   * Creates a new user and generates an authentication token.
   * @param createUserDto - The data required to create a new user.
   * @returns An object containing the created user and the authentication token.
   * @throws If there is an error creating the user.
   */
  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    try {
      const newUser = new this.userModel(createUserDto);
      const savedUser = await newUser.save();

      const payload = { id: savedUser._id };

      const secret = process.env.JWT_SECRET || 'secret_key';

      const token = jwt.sign(payload, secret);

      return {
        user: savedUser,
        token: token,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Retrieves all users from the database.
   * @returns A promise that resolves to an array of User objects.
   * @throws If there is an error while retrieving the users.
   */
  async getUsers(): Promise<User[]> {
    try {
      const users = await this.userModel.find();
      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }
  /**
   * Retrieves a user based on the provided token.
   * @param token - The token used to authenticate the user.
   * @returns A Promise that resolves to the user object if found, or null if not found.
   * @throws If there is an error retrieving the user.
   */
  async getUser(token: string): Promise<User | null> {
    try {
      const secret = process.env.JWT_SECRET || 'secret_key';
      const decodedToken = jwt.verify(token, secret) as { id: string };
      const userId = decodedToken.id;
      const cachedUser = await this.redis.get(`user:${userId}`);
      if (cachedUser) {
        return JSON.parse(cachedUser) as User;
      }

      const user = await this.userModel.findById(userId);

      if (user) {
        await this.redis.set(
          `user:${userId}`,
          JSON.stringify(user),
          'EX',
          3600,
        );
      }

      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Deletes a user and all associated data.
   * @param {string} token - The JWT token of the user to be deleted.
   * @returns {Promise<{ success: boolean }>} - A promise that resolves to an object indicating the success of the operation.
   * @throws {Error} - If there is an error deleting the user.
   */
  async deleteUser(token: string) {
    try {
      const secret = process.env.JWT_SECRET || 'secret_key';
      const decodedToken = jwt.verify(token, secret) as { id: string };
      const userId = decodedToken.id;

      await this.userModel.findByIdAndDelete(userId);
      await this.blockModel.deleteMany({
        $or: [{ userId: userId }, { blockedUserId: userId }],
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Blocks a user by adding a block record in the database.
   * @param blockedUserId - The ID of the user to be blocked.
   * @param token - The JWT token used for authentication.
   * @returns A Promise that resolves to the blocked user if successful, or null if not found.
   * @throws An error if the user to be blocked is not found, if the user tries to block themselves,
   * if the user is already blocked, or if there is an error during the blocking process.
   */
  async blockUser(blockedUserId: string, token: string): Promise<User | null> {
    try {
      const secret = process.env.JWT_SECRET || 'secret_key';
      const decodedToken = jwt.verify(token, secret) as { id: string };
      const userId = decodedToken.id;
      const user = await this.userModel.findById(userId);

      const blockedUser = await this.userModel.findById(blockedUserId);
      if (!blockedUser) {
        throw new Error('User not found');
      }
      if (blockedUserId === userId) {
        throw new Error('You cannot block yourself');
      }
      const existingBlock = await this.blockModel.findOne({
        userId: user._id,
        blockedUserId: blockedUser._id,
      });

      if (existingBlock) {
        throw new Error('User already blocked');
      }

      const newBlock = new this.blockModel({
        blockedUserId: blockedUser._id,
        userId: user._id,
      });
      await newBlock.save();

      return blockedUser;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  /**
   * Searches for users based on the provided criteria.
   * @param username - The username to search for.
   * @param token - The JWT token for authentication.
   * @param minAge - The minimum age of the users to search for (optional).
   * @param maxAge - The maximum age of the users to search for (optional).
   * @returns A promise that resolves to an array of User objects matching the search criteria.
   * @throws If there is an error searching for users.
   */
  async searchUsers(
    username: string,
    token: string,
    minAge?: number,
    maxAge?: number,
  ): Promise<User[]> {
    try {
      const secret = process.env.JWT_SECRET || 'secret_key';
      const decodedToken = jwt.verify(token, secret) as { id: string };
      const userId = decodedToken.id;
      const blockedUsers = await this.blockModel.find({ userId });
      const blockedUserIds = blockedUsers.map(({ _id }) => _id);

      const ageCondition: { birthdate?: { $gte?: Date; $lte?: Date } } = {};

      if (minAge !== undefined && maxAge !== undefined) {
        if (minAge <= maxAge) {
          const minBirthdate = new Date();
          minBirthdate.setFullYear(minBirthdate.getFullYear() - maxAge);
          const maxBirthdate = new Date();
          maxBirthdate.setFullYear(maxBirthdate.getFullYear() - minAge);
          ageCondition.birthdate = { $gte: minBirthdate, $lte: maxBirthdate };
        }
      } else if (minAge !== undefined) {
        const currentYear = new Date().getFullYear();
        const minBirthYear = currentYear - minAge;
        const minBirthdate = new Date(minBirthYear, 0, 1);
        ageCondition.birthdate = { $lte: minBirthdate };
      } else if (maxAge !== undefined) {
        const maxBirthdate = new Date();
        maxBirthdate.setFullYear(maxBirthdate.getFullYear() - maxAge);
        ageCondition.birthdate = { $gte: maxBirthdate };
      }

      const conditions = {
        _id: {
          $ne: new Types.ObjectId(userId),
          $nin: blockedUserIds,
        },
        $or: [
          { username: { $regex: new RegExp(username, 'i') } },
          ageCondition,
        ],
      };

      const users = await this.userModel.find(conditions);
      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Unblocks a user by removing the block entry from the database.
   * @param blockedUserId - The ID of the user to unblock.
   * @param token - The JWT token used for authentication.
   * @returns A promise that resolves to an object indicating the success of the operation.
   * @throws If there is an error while unblocking the user.
   */
  async unblockUser(blockedUserId: string, token: string) {
    try {
      const secret = process.env.JWT_SECRET || 'secret_key';
      const decodedToken = jwt.verify(token, secret) as { id: string };
      const userId = decodedToken.id;
      await this.blockModel.deleteMany({
        userId: new Types.ObjectId(userId),
        blockedUserId: new Types.ObjectId(blockedUserId),
      });
      return { success: true };
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  /**
   * Updates a user with the provided data.
   * @param userId - The ID of the user to update.
   * @param updateUserDto - The data to update the user with.
   * @returns A promise that resolves to the updated user.
   * @throws If there is an error updating the user.
   */
  async updateUser(token: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const secret = process.env.JWT_SECRET || 'secret_key';
      const decodedToken = jwt.verify(token, secret) as { id: string };
      const userId = decodedToken.id;
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        updateUserDto,
        { new: true },
      );
      if (!updatedUser) {
        throw new Error('User not found');
      }
      if (updatedUser) {
        await this.redis.set(
          `user:${userId}`,
          JSON.stringify(updatedUser),
          'EX',
          3600,
        );
      }
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}
