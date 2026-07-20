const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('donghua_html.html', 'utf8');
const $ = cheerio.load(html);

// Print all text in bixbox headers
$('.bixbox .releases h3, .bixbox h2').each((_, el) => {
  console.log($(el).text().trim());
});

// Check if there is anything with 'related' or 'recommend'
console.log('Class related?', $('.related').length);
console.log('Class recommend?', $('.recommend').length);
