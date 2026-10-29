# Rakuten Books API

The complete Access key is saved in the ignored local file `rakuten-secrets.json`. The server reads it automatically; you can instead set `RAKUTEN_ACCESS_KEY` in the environment to override it. Start the app with `node server.cjs`. To configure without the local file, use:

```powershell
$env:RAKUTEN_APPLICATION_ID = 'your application ID'
$env:RAKUTEN_ACCESS_KEY = 'your complete access key'
node server.cjs
```

Open `http://localhost:8431`. The Rakuten Books chip is enabled in the API search screen. Credentials stay on the server and are sent to Rakuten in the `accessKey` header. The secret file is excluded from Git by `.gitignore`.

Restart the server after changing the local secrets file. If this key is visible to anyone else through a shared chat or screenshot, rotate it in Rakuten Web Service.
