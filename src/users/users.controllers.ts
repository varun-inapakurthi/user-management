import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/CreateUser.dto';
import { BadRequestException, Headers } from '@nestjs/common';
import { UpdateUserDto } from './dto/UpdateUser.dto';

/**
 * Controller for handling user-related operations.
 */
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * Creates a new user.
   * @param createUserDto - The data for creating a new user.
   * @returns The created user.
   */
  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  /**
   * Retrieves all users.
   * @returns All users.
   */
  @Get('/all')
  getUsers() {
    return this.usersService.getUsers();
  }

  /**
   * Retrieves a user based on the authorization header.
   * @param authHeader - The authorization header containing the token.
   * @returns The user associated with the token.
   * @throws BadRequestException if the authorization header is missing or invalid.
   */
  @Get('')
  getUser(@Headers('authorization') authHeader: string) {
    const token = this.extractTokenFromHeader(authHeader);
    if (!token) {
      throw new BadRequestException('Missing or invalid Authorization header');
    }
    return this.usersService.getUser(token);
  }

  /**
   * Extracts the token from the authorization header.
   * @param authHeader - The authorization header.
   * @returns The extracted token or null if not found.
   */
  private extractTokenFromHeader(authHeader: string): string | null {
    const bearerToken = authHeader?.split(' ')[1];
    return bearerToken || null;
  }

  /**
   * Deletes a user based on the authorization header.
   * @param authHeader - The authorization header containing the token.
   * @returns The deleted user.
   * @throws BadRequestException if the authorization header is missing or invalid.
   */
  @Delete()
  deleteUser(@Headers('authorization') authHeader: string) {
    const token = this.extractTokenFromHeader(authHeader);
    if (!token) {
      throw new BadRequestException('Missing or invalid Authorization header');
    }
    return this.usersService.deleteUser(token);
  }

  /**
   * Blocks a user based on the user ID and authorization header.
   * @param authHeader - The authorization header containing the token.
   * @param id - The ID of the user to block.
   * @returns The blocked user.
   * @throws BadRequestException if the authorization header is missing or invalid.
   */
  @Post('/block/:id')
  blockUser(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const token = this.extractTokenFromHeader(authHeader);
    if (!token) {
      throw new BadRequestException('Missing or invalid Authorization header');
    }
    return this.usersService.blockUser(id, token);
  }

  /**
   * Searches for users based on the provided criteria.
   * @param authHeader - The authorization header containing the token.
   * @param username - The username to search for.
   * @param minAge - The minimum age of the users to search for.
   * @param maxAge - The maximum age of the users to search for.
   * @returns The search results.
   * @throws BadRequestException if the authorization header is missing or invalid.
   */
  @Get('/search')
  searchUser(
    @Headers('authorization') authHeader: string,
    @Query('username') username: string,
    @Query('minAge') minAge: number,
    @Query('maxAge') maxAge: number,
  ) {
    const token = this.extractTokenFromHeader(authHeader);
    if (!token) {
      throw new BadRequestException('Missing or invalid Authorization header');
    }
    return this.usersService.searchUsers(username, token, minAge, maxAge);
  }

  /**
   * Unblocks a user based on the user ID and authorization header.
   * @param authHeader - The authorization header containing the token.
   * @param id - The ID of the user to unblock.
   * @returns The unblocked user.
   * @throws BadRequestException if the authorization header is missing or invalid.
   */
  @Post('/unblock/:id')
  unblockUser(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const token = this.extractTokenFromHeader(authHeader);
    if (!token) {
      throw new BadRequestException('Missing or invalid Authorization header');
    }
    return this.usersService.unblockUser(id, token);
  }

  @Put()
  updateUser(
    @Headers('authorization') authHeader: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const token = this.extractTokenFromHeader(authHeader);
    if (!token) {
      throw new BadRequestException('Missing or invalid Authorization header');
    }
    return this.usersService.updateUser(token, updateUserDto);
  }
}
