# Confront

### Your environment configuration frontloader



(1) first a `realm` is established from the environment:

```bash
export NODE_ENV = production
# or export SERVER_ENV = development
```
or from the CLI execution context:

```bash
node file.js -realm some-other-realm
```


(2) we read static configs and override in the following order:

- {package.json}.config
- config.json
- `realm`.json


(3) and lastly we override with any command line options specified

```bash
node server.js -port 3333 -hostname sample.foo.com -safe-mode
```



```javascript

// in server.js...

var confront = require('confront');   // or configure wth: confront({options});

var config = confront.detect();

/*
{
	"port": "3333",
	"hostname": "sample.foo.com",
	"safeMode": true,
	"someParam": ...was speficied in package.json{config.someParam}
	"aSetting": ...found in config.json, for example
}
 */

```


See [a relative link](options.md) for a list of options.
