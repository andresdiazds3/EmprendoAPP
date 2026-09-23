import { usersRepository } from "./users.repository";
import { UpdateProfileDto } from "./dtos/update-profile.dto";
import { NotFoundError } from "../../core/errors";
import { cloudinaryService } from "../../shared/services/cloudinary.service";

export class UsersService {
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existingUser = await usersRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError("Usuario");
    }

    const isImageChanged =
      dto.profilePicturePublicId !== undefined &&
      dto.profilePicturePublicId !== existingUser.profilePicturePublicId;
    const isImageRemoved =
      dto.profilePictureUrl === null || dto.profilePicturePublicId === null;

    if (existingUser.profilePicturePublicId && (isImageChanged || isImageRemoved)) {
      await cloudinaryService.deleteImage(existingUser.profilePicturePublicId);
    }

    const updatedUser = await usersRepository.updateProfile(userId, dto);

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}

export const usersService = new UsersService();
