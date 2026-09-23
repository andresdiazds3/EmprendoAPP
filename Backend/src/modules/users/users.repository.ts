import { prisma } from "../../config/prisma";
import { UpdateProfileDto } from "./dtos/update-profile.dto";

export class UsersRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.profilePictureUrl !== undefined && { profilePictureUrl: data.profilePictureUrl }),
        ...(data.profilePicturePublicId !== undefined && { profilePicturePublicId: data.profilePicturePublicId }),
      },
    });
  }
}

export const usersRepository = new UsersRepository();
