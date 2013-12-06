## Argo Gzip Package

Now you can gzip with a simple argo middleware!

Usage.

```javascript
	var argo = require("argo"),
	    gzip = require("argo-gzip");

	argo()
		.use(gzip)
		.target("http://www.endpointAPI.com/");

//Now all request that come in with a "Accept-Encoding:gzip" header will be zipped
//All responses that are from the backend server that are gzipped are handled now as well
```
