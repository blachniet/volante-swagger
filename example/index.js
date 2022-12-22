const volante = require('volante');
let hub = new volante.Hub();
hub.on('VolanteExpress.app', (app) => {
  app.get('/', (req, res) => {
    res.redirect('/api/swagger');
  });
});
hub.loadConfig('example/config.json');