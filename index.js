const fs = require('fs');
const path = require('path');
const volante = require('volante');
const swaggerJSDoc = require('swagger-jsdoc');

module.exports = {
  name: 'VolanteSwagger',
  props: {
    enabled: true,              // enable the Swagger UI
    title: '',                  // title for Swagger UI
    description: '',            // description for Swagger UI
    src: '/src',                // path to sources, relative to parent project root
    ui: '/api/swagger',         // ui path relative to volante-express http server root
    json: '/api/swagger.json',  // swagger.json path relative to volante-express http server root
  },
  data() {
    return {
      router: null,
      // swagger-jsdoc options
      options: {
        definition: {
          openapi: '3.0.1',
          info: {
            title: this.title,
            version: this.$hub.parentVersion,
            description: this.description,
          },
          securityDefinitions: {
            JWT: {
              type: 'apiKey',
              name: 'Authorization',
              in: 'header',
            },
            SignInAuth: {
              type: 'basic',
            },
          },
          responses: {
            InternalServerError: {
              description: "Internal Server Error"
            },
            OK: {
              description: "OK"
            },
            Unauthorized: {
              description: "Unauthorized"
            }
          },
          basePath: '/',
        },
        apis: [path.join(volante.parentRoot, this.src, '**/*.js')],
      },
      swaggerUiDistPath: './node_modules/swagger-ui-dist',
      newHtml: '',
    };
  },
  init() {
    // set up the routes
    this.router = require('express').Router();

    this.newHtml = this.hackSwaggerHtmlFile();

    // expose the json
    this.router.all(this.json, (req, res) => res.json(swaggerJSDoc(this.options)));

    // everything else is handled by serveSwaggerUi
    this.router.all(`${this.ui}*`, this.serveSwaggerUi);
  },
  events: {
    'VolanteExpress.pre-start'(app) {
      if (this.enabled) {
        app.use(this.router);
      }
    },
  },
  methods: {
    // hack the swagger html file to
		// 1. not show the petstore demo by default, but pull our json
		// 2. fix path root to be at this.ui
    hackSwaggerHtmlFile() {
      return fs.readFileSync(path.join(__dirname, this.swaggerUiDistPath, 'index.html'), { encoding:'utf-8' })
               .replace('https://petstore.swagger.io/v2/swagger.json', this.json)
               .replace('</title>', `</title><base href="${this.ui}/">`);
    },
    // express middleware function to send swagger ui
    serveSwaggerUi(req, res) {
      let p = req.path.split(/\/swagger\/?/);
      if (p[1].length === 0) {
        res.send(this.newHtml);
      } else {
        res.sendFile(p[1], {root: path.join(__dirname, this.swaggerUiDistPath)});
      }
    },
  }
};