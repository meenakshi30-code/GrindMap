import User from "../models/user.model.js";

export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, bio } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.bio = bio || user.bio;

    const updated = await user.save();

    res.json({
      message: "Profile updated",
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        bio: updated.bio,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
