const { Router } = require('express');
const reportService = require('../services/reportService');
const { requireAuth } = require('../middleware/auth');
const { badRequest } = require('../utils/errors');
const { isValidDateString } = require('../utils/dates');

const router = Router();
router.use(requireAuth);

const requireDate = (raw) => {
  if (!isValidDateString(raw)) throw badRequest('Please provide a date in YYYY-MM-DD format.', 'date');
  return raw;
};

// GET /api/reports?date=2026-10-15  -> all three reports in one call (used by the dashboard)
router.get('/', async (req, res) => {
  const date = requireDate(req.query.date);
  const [daily, monthToDate, monthly] = await Promise.all([
    reportService.dailyReport(req.user.id, date),
    reportService.monthToDateReport(req.user.id, date),
    reportService.monthlyReport(req.user.id, date),
  ]);
  res.json({ date, daily, monthToDate, monthly });
});

router.get('/daily', async (req, res) => {
  res.json(await reportService.dailyReport(req.user.id, requireDate(req.query.date)));
});

router.get('/month-to-date', async (req, res) => {
  res.json(await reportService.monthToDateReport(req.user.id, requireDate(req.query.date)));
});

router.get('/monthly', async (req, res) => {
  res.json(await reportService.monthlyReport(req.user.id, requireDate(req.query.date)));
});

router.get('/chart', async (req, res) => {
  res.json(await reportService.chartData(req.user.id, requireDate(req.query.date)));
});

module.exports = router;
