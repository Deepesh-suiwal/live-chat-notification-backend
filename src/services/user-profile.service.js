import UserProfile from "../models/user-profile.js";
import User from "../models/user-register.js";
import {
  deleteFromCloudinary,
  uploadImageToCloudinary,
} from "../utils/cloudinary-upload.js";

export const getUserProfileService = async (userId) => {
  const profile = await UserProfile.findOne({ userId }).populate(
    "userId",
    "email",
  );

  if (!profile) {
    return {
      status: 404,
      message: "Profile not found",
    };
  }

  const profileObj = profile.toObject();

  return {
    status: 200,
    message: "Profile fetched successfully",
    data: {
      email: profileObj.userId.email,
      ...profileObj,
      userId: undefined,
    },
  };
};

export const updateUserProfileService = async ({ userId, body, file }) => {
  const profile = await UserProfile.findOne({ userId });

  if (!profile) {
    return {
      status: 404,
      message: "Profile not found",
    };
  }

  let avatar;
  let avatarPath;

  if (file) {
    // delete old avatar if exists
    if (profile.avatarPath) {
      await deleteFromCloudinary(profile.avatarPath);
    }

    // upload new avatar
    const uploadResult = await uploadImageToCloudinary(
      file.buffer,
      "user-profile",
      file.mimetype,
    );

    avatar = uploadResult.secure_url;
    avatarPath = uploadResult.public_id;
  }

  const updateData = {
    ...body,
  };

  if (avatar) {
    updateData.avatar = avatar;
    updateData.avatarPath = avatarPath;
  }

  const updatedProfile = await UserProfile.findOneAndUpdate(
    { userId },
    updateData,
    {
      returnDocument: "after",
      runValidators: true,
    },
  ).populate("userId", "email");

  // update fullname in user collection
  if (body.fullName) {
    await User.findByIdAndUpdate(userId, {
      fullName: body.fullName,
    });
  }

  const profileObj = updatedProfile.toObject();

  return {
    status: 200,
    message: "Profile updated successfully",
    data: {
      email: profileObj.userId.email,
      ...profileObj,
      userId: undefined,
    },
  };
};

export const deleteUserAvatarService = async (userId) => {
  const profile = await UserProfile.findOne({ userId });

  if (!profile) {
    return {
      status: 404,
      message: "Profile not found",
    };
  }

  // check avatar exists
  if (!profile.avatarPath) {
    return {
      status: 400,
      message: "No avatar to delete",
    };
  }

  // delete from cloudinary
  await deleteFromCloudinary(profile.avatarPath);

  // remove avatar from DB
  profile.avatar = undefined;
  profile.avatarPath = undefined;

  await profile.save();

  return {
    status: 200,
    message: "Profile picture deleted successfully",
    data: null,
  };
};
