const volante = require('volante');
let hub = new volante.Hub().loadConfig('example/config.json');
hub.on('VolanteExpress.pre-start', (app) => {
  app.use('/', (req, res) => {
    res.redirect('/api/swagger');
  });
});
hub.emit('VolanteExpress.start');
