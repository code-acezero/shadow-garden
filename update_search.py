import re

with open('src/app/search/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add library to imports
content = content.replace('import { AnimeService } from \'@/lib/api\';', 'import { AnimeService } from \'@/lib/api\';\nimport { dpi } from \'@/lib/dpi\';\nimport { hpi } from \'@/lib/hpi\';')

# Constants
constants = '''
const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Isekai", "Mecha", "Mystery", "Psychological", "Romance", "Sci-Fi", "Seinen", "Shoujo", "Shounen", "Slice of Life", "Sports", "Supernatural", "Thriller"];
const TYPES = ["tv", "movie", "ova", "ona", "special"];
const STATUS_OPTIONS = ["currently-airing", "finished-airing", "not-yet-aired"];
const SEASONS = ["spring", "summer", "fall", "winter"];
const YEARS = Array.from({ length: 2027 - 2000 }, (_, i) => (2027 - i).toString());
const SORT_OPTIONS = [
  { value: "newest", label: "Latest", icon: Clock },
  { value: "popular", label: "Popular", icon: Flame },
  { value: "trending", label: "Trending", icon: TrendingUp },
  { value: "rating", label: "Top Rated", icon: Star },
];

const DONGHUA_GENRES = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Harem", "Historical", "Martial Arts", "Mecha", "Mystery", "Romance", "Sci-Fi", "Shounen", "Slice of Life"];
const DONGHUA_STATUS = ["ongoing", "completed"];
const DONGHUA_SORT = [{value: 'update', label: 'Latest', icon: Clock}, {value: 'popular', label: 'Popular', icon: Flame}, {value: 'rating', label: 'Top Rated', icon: Star}];

const HINDI_GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "TV Movie", "Thriller", "War", "Western"];
const HINDI_TYPES = ["Movie", "Series", "Drama"];
const HINDI_STATUS = ["Ongoing", "Completed"];
const HINDI_SORT = [{value: 'newest', label: 'Latest', icon: Clock}, {value: 'score', label: 'Top Rated', icon: Star}];
'''

content = re.sub(r'const GENRES =.*?(?=\n// --- SUB COMPONENTS ---)', constants, content, flags=re.DOTALL)

# Add library state
content = content.replace("const modeParam = searchParams.get('mode') || '';", "const modeParam = searchParams.get('mode') || '';\n  const libraryParam = searchParams.get('library') || 'main';")
content = content.replace("const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');", "const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');\n  const [selectedLibrary, setSelectedLibrary] = useState(libraryParam);")

# FetchResults logic
old_fetch = '''      if (modeParam === 'az') {
        // A-Z mode - fetch all anime alphabetically
        data = await AnimeService.getFilteredAnime('recent', currentPage);
      } else if (keyword) {
        data = await AnimeService.search(keyword, currentPage);
      } else if (selectedGenres.length > 0 || selectedType || selectedStatus) {
        const params: Record<string, any> = { page: currentPage };
        if (selectedGenres.length) params.genres = selectedGenres.join(',').toLowerCase();
        if (selectedType) params.type = selectedType;
        if (selectedStatus) params.status = selectedStatus;
        if (selectedSeason) params.season = selectedSeason;
        if (selectedYear) params.year = selectedYear;
        const filterResults = await AnimeService.filter(params);
        data = { results: filterResults, currentPage, hasNextPage: filterResults.length >= 20 };
      } else {
        // Default: show trending/popular
        data = await AnimeService.getFilteredAnime(selectedSort === 'popular' ? 'popular' : selectedSort === 'trending' ? 'trending' : 'recent', currentPage);
      }'''

new_fetch = '''      if (selectedLibrary === 'donghua') {
        if (keyword) {
            const res = await dpi.search(keyword, currentPage);
            data = { results: res, currentPage, hasNextPage: res.length >= 20 };
        } else if (selectedGenres.length > 0 || selectedType || selectedStatus || selectedSort !== 'update') {
            const params: Record<string, any> = { page: currentPage };
            if (selectedGenres.length) params.genre = selectedGenres.join(',');
            if (selectedType) params.type = selectedType;
            if (selectedStatus) params.status = selectedStatus;
            params.order = selectedSort === 'newest' ? 'update' : selectedSort;
            const res = await dpi.filter(params);
            data = { results: res, currentPage, hasNextPage: res.length >= 24 };
        } else {
            const res = await dpi.filter({ order: 'update', page: currentPage });
            data = { results: res, currentPage, hasNextPage: res.length >= 24 };
        }
      } else if (selectedLibrary === 'hindi') {
        if (keyword) {
            data = await hpi.search(keyword, currentPage);
        } else if (selectedGenres.length > 0 || selectedType || selectedStatus || selectedSort !== 'newest') {
            const params: Record<string, any> = { page: currentPage };
            if (selectedGenres.length) params.genre = selectedGenres.join(',');
            if (selectedType) params.type = selectedType;
            if (selectedStatus) params.status = selectedStatus;
            if (selectedSort !== 'newest') params.sort = selectedSort;
            data = await hpi.filter(params);
        } else {
            const res = await hpi.filter({ sort: 'updated_at', page: currentPage });
            data = { results: res.results || res.items || [], hasNextPage: res.hasNextPage, currentPage: res.currentPage };
        }
      } else {
        if (modeParam === 'az') {
          data = await AnimeService.getFilteredAnime('recent', currentPage);
        } else if (keyword) {
          data = await AnimeService.search(keyword, currentPage);
        } else if (selectedGenres.length > 0 || selectedType || selectedStatus || selectedSeason || selectedYear) {
          const params: Record<string, any> = { page: currentPage };
          if (selectedGenres.length) params.genres = selectedGenres.join(',').toLowerCase();
          if (selectedType) params.type = selectedType;
          if (selectedStatus) params.status = selectedStatus;
          if (selectedSeason) params.season = selectedSeason;
          if (selectedYear) params.year = selectedYear;
          const filterResults = await AnimeService.filter(params);
          data = { results: filterResults, currentPage, hasNextPage: filterResults.length >= 20 };
        } else {
          data = await AnimeService.getFilteredAnime(selectedSort === 'popular' ? 'popular' : selectedSort === 'trending' ? 'trending' : 'recent', currentPage);
        }
      }'''

content = content.replace(old_fetch, new_fetch)

# Update fetchResults dependency array
content = content.replace("[keyword, currentPage, selectedGenres, selectedType, selectedStatus, selectedSeason, selectedYear, selectedSort, modeParam]", "[keyword, currentPage, selectedGenres, selectedType, selectedStatus, selectedSeason, selectedYear, selectedSort, modeParam, selectedLibrary]")

# Update handleSearch URL params
old_handle = '''    if (query) params.set('keyword', query);
    if (selectedGenres.length) params.set('genres', selectedGenres.join(','));
    if (selectedSort !== 'newest') params.set('sort', selectedSort);
    router.push(`/search?${params.toString()}`);'''
new_handle = '''    if (query) params.set('keyword', query);
    if (selectedGenres.length) params.set('genres', selectedGenres.join(','));
    if (selectedSort !== 'newest' && selectedSort !== 'update') params.set('sort', selectedSort);
    if (selectedLibrary !== 'main') params.set('library', selectedLibrary);
    router.push(`/search?${params.toString()}`);'''
content = content.replace(old_handle, new_handle)

# Dynamic filter arrays based on library
content = content.replace('GENRES.map(g', 'activeGenres.map(g')
content = content.replace('{GENRES.map(g', '''{(() => {
                  const activeGenres = selectedLibrary === 'donghua' ? DONGHUA_GENRES : selectedLibrary === 'hindi' ? HINDI_GENRES : GENRES;
                  return activeGenres.map(g => (''')
content = content.replace('onClick={() => toggleGenre(g)}', 'onClick={() => toggleGenre(g)}')
content = content.replace('/>\\n                  ))}</div>', '/>\\n                  ));\\n                })()}\\n                </div>')
# Wait, let's fix the above replacement more robustly
content = re.sub(r'\{GENRES\.map\(g => \(\s*<FilterChip[^>]*?/>\s*\)\)\}', '''{(() => {
                  const activeGenres = selectedLibrary === 'donghua' ? DONGHUA_GENRES : selectedLibrary === 'hindi' ? HINDI_GENRES : GENRES;
                  return activeGenres.map(g => (
                    <FilterChip
                      key={g}
                      label={g}
                      active={selectedGenres.includes(g.toLowerCase())}
                      onClick={() => toggleGenre(g)}
                    />
                  ));
                })()}''', content, flags=re.DOTALL)

# Dropdowns
old_dropdowns = '''              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SelectDropdown label="Type" icon={Tv} options={TYPES} value={selectedType} onChange={setSelectedType} />
                <SelectDropdown label="Status" icon={Info} options={STATUS_OPTIONS} value={selectedStatus} onChange={setSelectedStatus} />
                <SelectDropdown label="Season" icon={Calendar} options={SEASONS} value={selectedSeason} onChange={setSelectedSeason} />
                <SelectDropdown label="Year" icon={Layers} options={YEARS} value={selectedYear} onChange={setSelectedYear} />
              </div>'''

new_dropdowns = '''              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {selectedLibrary !== 'donghua' && <SelectDropdown label="Type" icon={Tv} options={selectedLibrary === 'hindi' ? HINDI_TYPES : TYPES} value={selectedType} onChange={setSelectedType} />}
                <SelectDropdown label="Status" icon={Info} options={selectedLibrary === 'donghua' ? DONGHUA_STATUS : selectedLibrary === 'hindi' ? HINDI_STATUS : STATUS_OPTIONS} value={selectedStatus} onChange={setSelectedStatus} />
                {selectedLibrary === 'main' && <SelectDropdown label="Season" icon={Calendar} options={SEASONS} value={selectedSeason} onChange={setSelectedSeason} />}
                {selectedLibrary === 'main' && <SelectDropdown label="Year" icon={Layers} options={YEARS} value={selectedYear} onChange={setSelectedYear} />}
              </div>'''
content = content.replace(old_dropdowns, new_dropdowns)

# Sort options dynamic
old_sort_map = '''{SORT_OPTIONS.map(opt => ('''
new_sort_map = '''{(selectedLibrary === 'donghua' ? DONGHUA_SORT : selectedLibrary === 'hindi' ? HINDI_SORT : SORT_OPTIONS).map(opt => ('''
content = content.replace(old_sort_map, new_sort_map)

# Add Library Tabs in Hero
hero_tabs = '''          {/* Library Tabs */}
          <div className="mt-4 flex gap-2">
            {['main', 'donghua', 'hindi'].map(lib => (
                <button
                    key={lib}
                    onClick={() => {
                        setSelectedLibrary(lib);
                        setSelectedGenres([]);
                        setSelectedType('');
                        setSelectedStatus('');
                        setSelectedSeason('');
                        setSelectedYear('');
                        setSelectedSort(lib === 'donghua' ? 'update' : 'newest');
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('library', lib);
                        params.delete('page');
                        params.delete('genres');
                        params.delete('type');
                        params.delete('status');
                        params.delete('sort');
                        router.push(`/search?${params.toString()}`);
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${selectedLibrary === lib ? 'bg-primary-600 text-white' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                >
                    {lib}
                </button>
            ))}
          </div>

          {/* Search Bar */}'''
content = content.replace('{/* Search Bar */}', hero_tabs)

with open('src/app/search/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated search/page.tsx successfully')
