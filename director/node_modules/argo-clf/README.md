##Argo Common Log Formatter

Just a logger! Just spits logs to STDOUT for the time being.

Usage:
```javascript
  var clf = require('argo-clf');
  argo()
    .use(clf)
    .target("SOME URL")
    .list(3000)
```
