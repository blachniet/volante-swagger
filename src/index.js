const fs = require('fs');
const path = require('path');
const volante = require('volante');
const swaggerJSDoc = require('swagger-jsdoc');

module.exports = {
  name: 'VolanteSwagger',
  props: {
    dark: true,                 // enable dark mode
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
          openapi: '3.0.3', // swagger-ui doesn't support 3.1 yet
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
    // save hacked html
    this.newHtml = this.hackSwaggerHtmlFile();
  },
  events: {
    'VolanteExpress.router'(router) {
      if (this.enabled) {
        let r = router();
        // expose the json directly
        r.all(this.json, (req, res) => {
          res.json(swaggerJSDoc(this.options));
        });
        // everything else is handled by serveSwaggerUi
        r.all(`${this.ui}*`, this.serveSwaggerUi);
        this.$ready('swagger-ui is ready');
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
                  .replace('</title>', `</title><base href="${this.ui}/">`);
      if (this.dark) {
        ret = ret.replace('</body>', `</body><style>
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
  .swagger-ui section h3,
  .swagger-ui .opblock-description-wrapper,
  .swagger-ui .opblock-tag small {
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
  .swagger-ui .parameter__name,
  .swagger-ui .parameter__type {
    color: #f57d43;
  }
  .swagger-ui .link {
    color: #1a7fe1;
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
      if (p[1].length === 0) { // serve up index.html
        // emit an event signalling that swagger-ui is being used for those interested, include any accessible ip info
        this.$emit('VolanteSwagger.accessed', req.ip || req._remoteAddress || (req.connection && req.connection.remoteAddress));
        res.send(this.newHtml);
      } else { // file request
        switch (p[1]) {
          case 'swagger-initializer.js':
            let ret = fs.readFileSync(path.join(this.swaggerUiDistPath, 'swagger-initializer.js'), { encoding:'utf-8' })
                            .replace('https://petstore.swagger.io/v2/swagger.json', this.json);
            res.send(ret);
            break;
          default: // send it
            res.sendFile(p[1], { root: this.swaggerUiDistPath });
        }
      }
    },
  }
};