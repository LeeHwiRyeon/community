# Community Hub

A modern, responsive community webpage designed to bring people together and foster collaboration.

## Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional design with smooth animations
- **Interactive Elements**: Functional contact form with validation
- **Navigation**: Smooth scrolling navigation with mobile hamburger menu
- **Community Focused**: Sections for about, features, and contact information

## Getting Started

### Option 1: Simple File Viewing
Simply open `index.html` in your web browser to view the webpage.

### Option 2: Local Development Server
For the best experience and to test all features properly, serve the files using a local web server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open your browser and navigate to `http://localhost:8000`

## File Structure

```
.
├── index.html      # Main HTML file
├── styles.css      # CSS styling and responsive design
├── script.js       # JavaScript for interactivity
└── README.md       # This file
```

## Customization

The webpage is designed to be easily customizable:

- **Colors**: Modify the CSS custom properties in `styles.css`
- **Content**: Update the text content in `index.html`
- **Styling**: Customize the appearance by editing `styles.css`
- **Functionality**: Add new interactive features in `script.js`

## Browser Support

This webpage supports all modern browsers including:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Technologies Used

- HTML5
- CSS3 (with Flexbox and Grid)
- Vanilla JavaScript (ES6+)
- Responsive Web Design principles
