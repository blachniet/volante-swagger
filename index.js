const fs = require('fs');
const path = require('path');
const volante = require('volante');
const swaggerJSDoc = require('swagger-jsdoc');

module.exports = {
  name: 'VolanteSwagger',
  props: {
    dark: true,
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
            version: volante.parentVersion,
            description: this.description,
          },
          basePath: '/',
        },
        apis: [path.join(volante.parentRoot, this.src, '**/*.js')],
      },
      swaggerUiDistPath: null,
      newHtml: '',
    };
  },
  init() {
    // find path to swagger-ui-dist, could be under volante-swagger, or in project's flattened node_modules
    if (fs.existsSync('./node_modules/swagger-ui-dist')) {
      this.swaggerUiDistPath = path.resolve('./node_modules/swagger-ui-dist');
    } else {
      // assume it's in the parent's node_modules
      this.swaggerUiDistPath = path.join(volante.modulePath, 'swagger-ui-dist');
    }

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
		// 3. override css classes so we have dark mode
    hackSwaggerHtmlFile() {
      let ret = fs.readFileSync(path.join(this.swaggerUiDistPath, 'index.html'), { encoding:'utf-8' })
               .replace('https://petstore.swagger.io/v2/swagger.json', this.json)
               .replace('</title>', `</title><base href="${this.ui}/">`);
      if (this.dark) {
        ret = ret.replace('</style>', `
  body,
  .swagger-ui .opblock .opblock-section-header,
  .swagger-ui .scheme-container {
    background-color: #282828;
  }
  .swagger-ui,
  .swagger-ui .info .title,
  .swagger-ui .info li, .swagger-ui .info p, .swagger-ui .info table,
  .swagger-ui .opblock .opblock-summary-operation-id, .swagger-ui .opblock .opblock-summary-path, .swagger-ui .opblock .opblock-summary-path__deprecated,
  .swagger-ui .opblock-tag,
  .swagger-ui .opblock .opblock-summary-description,
  .swagger-ui .opblock .opblock-section-header h4,
  .swagger-ui section.models h4,
  .swagger-ui .model,
  .swagger-ui .model-title,
  .swagger-ui .response-col_status,
  .swagger-ui .response-col_links,
  .swagger-ui .tab li,
  .swagger-ui .btn,
  .swagger-ui label,
  .swagger-ui .dialog-ux .modal-ux-header h3,
  .swagger-ui .dialog-ux .modal-ux-content h4,
  .swagger-ui table thead tr td, .swagger-ui table thead tr th,
  .swagger-ui .opblock-description-wrapper p, .swagger-ui .opblock-external-docs-wrapper p, .swagger-ui .opblock-title_normal p,
  .swagger-ui section h3 {
    color: #ccc;
  }
  .swagger-ui input[type=email], .swagger-ui input[type=file], .swagger-ui input[type=password],
  .swagger-ui input[type=search], .swagger-ui input[type=text], .swagger-ui textarea,
  .swagger-ui select {
    background-color: #000;
    color: #ccc;
  }
  .swagger-ui section.models {
    border-color: #7d7d7d;
  }
  svg {
    fill: #ccc;
  }
  .swagger-ui .model-toggle:after {
    filter: invert(1);
  }
  .swagger-ui .prop-type {
    color: #2163C9;
  }
  .swagger-ui .dialog-ux .modal-ux {
    background-color: #202020;
    color: #ccc;
    border-color: #7d7d7d;
  }
  .swagger-ui section.models .model-container {
    background-color: #323334;
  }
</style>`);
      }
      return ret;
    },
    // express middleware function to send swagger ui
    serveSwaggerUi(req, res) {
      let p = req.path.split(/\/swagger\/?/);
      if (p[1].length === 0) {
        res.send(this.newHtml);
      } else {
        res.sendFile(p[1], { root: this.swaggerUiDistPath });
      }
    },
  }
};