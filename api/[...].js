const app = require('../20-10be/server');

module.exports = (req, res) => {
  const routeParam = req.query?.path;
  if (routeParam) {
    const route = (Array.isArray(routeParam) ? routeParam.join('/') : String(routeParam))
      .split('/')
      .filter(Boolean)
      .map(segment => encodeURIComponent(segment))
      .join('/');
    const query = new URLSearchParams((req.url || '/').split('?').slice(1).join('?'));
    query.delete('path');
    req.url = `/api/${route}${query.size ? `?${query.toString()}` : ''}`;
  }
  return app(req, res);
};
