# Volante Swagger Spoke

Volante module for Swagger/OpenAPI doc parsing and browsing through a live Swagger UI served through volante-express.

## Usage

```bash
npm install volante-swagger
```

Volante modules are automatically loaded and instanced if they are installed locally and `hub.attachAll()` is called. Or add it to the `"attach"` array in your volante config file.

```js
{
	"attach": [
		"volante-swagger"
	]
}
```

Once the Volante-powered server is running (for example, with volante-express defaults), the Swagger UI should be accessible at:

http://localhost:3000/api/swagger

## Props

Options are changed using either the config file `VolanteSwagger` sub-object:

```js
{
	"VolanteSwagger": {
		"enabled": true,
		"title": "Cool server",
		"description": "a description",
		"ui": "<defaults to /api/swagger>",
		"json": "<defaults to /api/swagger.json>"
	}
}
```

...or manually via a `VolanteSwagger.update` event with an options object:

```js
hub.emit('VolanteSwagger.update', {
	enabled: true,
	title: "Cool server",
	description: "a description",
	ui: "<defaults to /api/swagger>",
	json: "<defaults to /api/swagger.json>"
});
```

## License

ISC