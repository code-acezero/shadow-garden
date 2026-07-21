const fs = require('fs');
const path = 'src/app/movies/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/omni\.drama/g, 'omni.movies');
content = content.replace(/\/drama-watch/g, '/movies-watch');
content = content.replace(/library=drama/g, 'library=movies');
content = content.replace(/Search dramas\.\.\./g, 'Search movies & series...');
content = content.replace(/DramaSearch/g, 'MoviesSearch');
content = content.replace(/DramaRow/g, 'MoviesRow');
content = content.replace(/DramaGrid/g, 'MoviesGrid');
content = content.replace(/const Drama = /g, 'const Movies = ');
content = content.replace(/export default Drama;/g, 'export default Movies;');
content = content.replace(/'Drama'/g, "'Movies & Series'");

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced successfully.');
