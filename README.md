# Klowd portfolio (MVC, static site)

```
index.html          page structure
favicon.svg         browser tab icon
vercel.json         Vercel settings (clean URLs + basic security headers)
css/style.css       look: colors, fonts, layout, animations
js/model.js         MODEL: your content and data (edit this to change text, skills, projects, links)
js/view.js          VIEW: draws the data on the page
js/effects.js       visual effects: network background, cursor ring, tilt, magnetic buttons, reveal
js/controller.js    CONTROLLER: reacts to scrolling, clicks and the mouse
```

Preview locally: open `index.html` in a browser. No build step and no install needed.

## Deploy to Vercel

Option A: with GitHub (updates automatically when you change files)
1. Upload this folder's contents to a GitHub repository (keep the css and js folders).
2. On vercel.com choose Add New, then Project, then import that repository.
3. Framework Preset: Other. Leave Build Command and Output Directory empty. Click Deploy.

Option B: from your computer
1. Install Node.js, then run: npm i -g vercel
2. In this folder run: vercel (follow the prompts), then vercel --prod

Before deploying, replace the "#" links in js/model.js under profile.links with your real LinkedIn and GitHub URLs.
