const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('donghua_html.html', 'utf-8');
const $ = cheerio.load(html);

const related: any[] = [];
$('.bixbox.related .bs').each((_, el) => {
  const $el = $(el);
  const href = $el.find('a').attr('href') || '';
  const title = $el.find('.tt').text().trim();
  let image = $el.find('img').attr('src') || '';
  if (image.startsWith('//')) image = `https:${image}`;
  const type = $el.find('.typez').text().trim() || 'Donghua';
  const slug = href.replace('https://donghuaplanet.com', '').replace(/\/$/, '').replace(/^\//, '').replace('anime/', '');

  related.push({
    id: slug,
    slug: slug,
    title: title,
    image: image,
    type: type,
    href: `/donghua-watch/${slug}`
  });
});

console.log('Related count:', related.length);
console.log(JSON.stringify(related, null, 2));
