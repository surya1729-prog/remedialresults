const requireRoles = (...allowedRoles) => (req, res, next) => {
  const role = req.user?.role;

  if (!role) {
    return res.status(401).json({ message: "Unauthorized: role missing" });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      message: `Forbidden: requires role ${allowedRoles.join(" or ")}`
    });
  }

  next();
};

module.exports = {
  requireRoles
};
