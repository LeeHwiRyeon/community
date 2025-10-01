const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  const imageDir = path.join(__dirname, '../src/assets/images');
  const outputDir = path.join(__dirname, '../src/assets/images/optimized');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const files = fs.readdirSync(imageDir);
  
  for (const file of files) {
    if (/\.(jpg|jpeg|png)$/i.test(file)) {
      const inputPath = path.join(imageDir, file);
      const outputPath = path.join(outputDir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
      
      try {
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);
        
        console.log(`Optimized: ${file}`);
      } catch (error) {
        console.error(`Error optimizing ${file}:`, error);
      }
    }
  }
}

optimizeImages();