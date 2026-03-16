const sanitizeUser = (user) => ({
  id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  department: user.department,
  studentId: user.studentId,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

module.exports = sanitizeUser;
