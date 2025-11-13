# Nests Landing Page

A retro-styled ASCII art landing page for Nests.social built with pure HTML, CSS, and JavaScript.

## 🎨 Features

- **ASCII Art Design** - Fully embracing the retro terminal aesthetic
- **Matrix Rain Effect** - Subtle animated background
- **Glitch Effects** - Interactive hover animations
- **Responsive Design** - Works on all screen sizes
- **Easter Eggs** - Try the Konami code! (↑ ↑ ↓ ↓ ← → ← → B A)
- **Zero Dependencies** - Pure HTML, CSS, and vanilla JavaScript

## 🚀 Local Development

Simply open `index.html` in your browser:

```bash
cd website
open index.html  # macOS
# or
xdg-open index.html  # Linux
# or just double-click the file
```

For a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## 📦 Deployment Options

### Option 1: Vercel (Recommended - Easy)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy from the website directory:
```bash
cd website
vercel
```

3. Follow the prompts and set your custom domain to `nests.social`

4. Configure domain in Vercel dashboard:
   - Go to your project settings
   - Add `nests.social` as a custom domain
   - Update your DNS records as instructed

### Option 2: Netlify

1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Deploy:
```bash
cd website
netlify deploy --prod
```

3. Set custom domain in Netlify dashboard

### Option 3: GitHub Pages

1. Create a new repo or use existing
2. Push the `website` folder contents to a `gh-pages` branch
3. Enable GitHub Pages in repo settings
4. Configure custom domain to `nests.social`

### Option 4: Static Hosting (Cloudflare Pages, AWS S3, etc.)

Simply upload all files from the `website` directory to your hosting service and point `nests.social` to it.

## 🌐 DNS Configuration for nests.social

Once you've deployed, update your DNS records:

For Vercel/Netlify:
```
Type: A
Name: @
Value: [Provider's IP]

Type: CNAME
Name: www
Value: [Your deployment URL]
```

## 🎨 Customization

### Colors

Edit the CSS variables in `style.css`:

```css
:root {
    --bg-primary: #0a0a0a;      /* Background */
    --text-primary: #00ff00;     /* Main text (green) */
    --accent: #00ffff;           /* Accent color (cyan) */
    --border: #00ff00;           /* Border color */
}
```

### ASCII Art

Replace the ASCII art in `index.html` or create new variants in `script.js`

### Content

Edit the text directly in `index.html` - it's simple and straightforward!

## 📱 Mobile Responsive

The site automatically adjusts for mobile devices with responsive font sizes and layouts.

## 🎯 Performance

- **Lightweight**: ~15KB total (uncompressed)
- **Fast Load**: No external dependencies
- **SEO Friendly**: Semantic HTML with proper meta tags

## 🔒 Security

- No external scripts
- No tracking or analytics (add your own if needed)
- Static files only - no server-side processing needed

## 🎭 Easter Eggs

- Try the Konami code: ↑ ↑ ↓ ↓ ← → ← → B A
- Check the browser console for a surprise
- Watch the nest ASCII art animation

## 📄 License

Part of the Nests project. All rights reserved.

## 🤝 Contributing

This is part of a larger app project. To contribute, see the main README in the parent directory.

---

Built with ♥ and lots of ASCII art for the Nests community.

