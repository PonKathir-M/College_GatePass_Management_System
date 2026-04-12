const { Notification } = require("../models");

exports.myNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { UserUserId: req.user.id },
      order: [["createdAt", "DESC"]]
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    // If ID provided, mark specific one. Else mark all for user.
    const { id } = req.body;
    const whereClause = { UserUserId: req.user.id };

    if (id) {
      whereClause.id = id;
    }

    await Notification.update(
      { is_read: true },
      { where: whereClause }
    );

    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    next(err);
  }
};
