const { Router } = require('express');
const readingService = require('../services/readingService');
const { requireAuth } = require('../middleware/auth');
const { badRequest } = require('../utils/errors');
const { isValidDateString } = require('../utils/dates');

const router = Router();
router.use(requireAuth);

const parseId = (raw) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Invalid reading id.');
  return id;
};

const parsePositiveInt = (raw, fallback, name) => {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) throw badRequest(`${name} must be a positive whole number.`);
  return n;
};

const parseOptionalDate = (raw, name) => {
  if (raw === undefined || raw === '') return undefined;
  if (!isValidDateString(raw)) throw badRequest(`${name} must be a date in YYYY-MM-DD format.`);
  return raw;
};

// GET /api/readings?page=1&limit=20&from=2026-10-01&to=2026-10-31
router.get('/', async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1, 'page');
  const limit = Math.min(parsePositiveInt(req.query.limit, 20, 'limit'), 100);
  const from = parseOptionalDate(req.query.from, 'from');
  const to = parseOptionalDate(req.query.to, 'to');
  res.json(await readingService.listReadings(req.user.id, { page, limit, from, to }));
});

router.get('/:id', async (req, res) => {
  res.json(await readingService.getReading(req.user.id, parseId(req.params.id)));
});

router.post('/', async (req, res) => {
  res.status(201).json(await readingService.createReading(req.user.id, req.body));
});

router.put('/:id', async (req, res) => {
  res.json(await readingService.updateReading(req.user.id, parseId(req.params.id), req.body));
});

router.delete('/:id', async (req, res) => {
  await readingService.deleteReading(req.user.id, parseId(req.params.id));
  res.status(204).end();
});

module.exports = router;
