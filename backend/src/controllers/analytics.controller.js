const analyticsService = require('../services/analytics.service');

const getDashboardSummary = async (req, res) => {
  const summary = await analyticsService.getDashboardSummary();

  res.status(200).json({
    success: true,
    data: summary,
  });
};

module.exports = {
  getDashboardSummary,
};
