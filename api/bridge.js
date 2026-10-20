const app = require('../20-10be/server');

module.exports = (req, res) => {
  const incomingQuery = new URLSearchParams((req.url || '/').split('?').slice(1).join('?'));
  const routeParam = req.query?.path ?? incomingQuery.get('path');
  if (!routeParam) return res.status(400).json({ success: false, message: 'Thiếu đường dẫn API.' });

  const route = (Array.isArray(routeParam) ? routeParam.join('/') : String(routeParam))
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/');
  incomingQuery.delete('path');
  req.url = `/api/${route}${incomingQuery.size ? `?${incomingQuery.toString()}` : ''}`;
  return app(req, res);
};
