const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const targetDir = path.join(__dirname, 'modules');

walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.html')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = content
      .replace(/href="\/css\//g, 'href="css/')
      .replace(/href='\/css\//g, "href='css/")
      .replace(/src="\/js\//g, 'src="js/')
      .replace(/src='\/js\//g, "src='js/")
      .replace(/src="\/images\//g, 'src="images/')
      .replace(/src='\/images\//g, "src='images/")
      .replace(/src="\/assets\//g, 'src="assets/')
      .replace(/src='\/assets\//g, "src='assets/")
      .replace(/href="\/styles\.css"/g, 'href="styles.css"')
      .replace(/href='\/styles\.css'/g, "href='styles.css'")
      .replace(/src="\/app\.js"/g, 'src="app.js"')
      .replace(/src='\/app\.js'/g, "src='app.js'");

    if (content !== updated) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log('Cleanly updated paths in:', filePath);
    }
  }
});

console.log('Path fix completed with pure UTF-8 encoding!');
