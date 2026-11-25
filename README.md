# Klowd portfolio (MVC, static site + one small API)

```
index.html          page structure
favicon.svg         browser tab icon
vercel.json         Vercel settings (clean URLs + security headers)
package.json        tells Vercel this is a Node project (for the API)
api/visitors.js     serverless function: visit counter, countries and guestbook
css/style.css       look: colors, fonts, layout, animations
js/model.js         MODEL: your content, visitor data and the calls to /api/visitors
js/view.js          VIEW: draws everything on the page
js/effects.js       visual effects (network background, cursor ring, tilt, magnets, cloud burst)
js/controller.js    CONTROLLER: reacts to scrolling, clicks, keys and the mouse
```

Preview locally: open `index.html` in a browser. The Visitors section then runs in
preview mode (saved only in your own browser).

## Deploy to Vercel
1. Put this folder's contents in a GitHub repository (keep the folders).
2. On vercel.com: Add New > Project > import the repository.
3. Framework Preset: Other. Leave Build Command and Output Directory empty. Deploy.

## Turn on real visitor tracking (about 2 minutes, free tier is enough)
1. In your Vercel project open Storage (or Marketplace) and add Upstash Redis (free plan).
2. Connect it to your project. Vercel adds the environment variables for you.
3. Redeploy (Deployments > the latest one > Redeploy).
The badge in the Visitors section changes from "Preview mode" to "Live".

## What is tracked
Only the total number of visits and the visitor's country (from Vercel's country header),
plus guestbook entries that visitors choose to write. No IP addresses or personal details
are stored. Signing is optional. To remove an entry, delete it in the Upstash console
(Data Browser, key klowd:entries).

Before deploying, replace the "#" links in js/model.js under profile.links.
Shortcut for visitors: press Ctrl+K (or Cmd+K) for quick navigation.
