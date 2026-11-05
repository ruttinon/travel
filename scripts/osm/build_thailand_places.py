#!/usr/bin/env python3
"""Build Traval's OpenStreetMap place list for Thailand (owner: Tommy).

Dev-only tool — the app itself never needs Python. Run it once a month on a fresh
Geofabrik download, then import the result with `node scripts/osm/import_osm_places.js`.

    pip install osmium shapely
    python3 scripts/osm/build_thailand_places.py _osm-data/thailand-latest.osm.pbf scripts/osm/thailand-places.ndjson.gz

The raw .pbf (~330 MB) stays out of Git (keep it in _osm-data/); the output (~3 MB) is committed so teammates
can import without Python or the big download.

Keeps only NAMED places a traveller would look for (attractions, temples, museums,
parks, waterfalls, beaches, viewpoints, markets, cafés, restaurants, places to stay),
and gives each its province + Traval region from the province boundaries in the file.

Data © OpenStreetMap contributors, ODbL 1.0 — show the credit wherever these places appear.
"""
import gzip, json, re, sys, time
import osmium
from shapely import wkb as shapely_wkb
from shapely.strtree import STRtree
from shapely.geometry import Point

# ISO 3166-2:TH code → Traval region (Thailand's official six-region system, 77 provinces).
def region_for(code):
    n = int(code)
    if n in (63, 70, 71, 76, 77): return 'west'
    if 20 <= n <= 25 or n == 27: return 'east'
    if 30 <= n <= 49: return 'northeast'
    if 50 <= n <= 58: return 'north'
    if 80 <= n <= 96: return 'south'
    return 'central'  # 10–19, 26, 60–62, 64–67, 72–75

# (kind, team category) for the first matching tag. Team categories: nature, food, stay, culture.
RULES = [
    ('tourism', {'museum': ('museum', 'culture'), 'gallery': ('gallery', 'culture'), 'viewpoint': ('viewpoint', 'nature'),
                 'theme_park': ('theme_park', 'culture'), 'zoo': ('zoo', 'nature'), 'aquarium': ('aquarium', 'nature'),
                 'hotel': ('hotel', 'stay'), 'guest_house': ('guest_house', 'stay'), 'hostel': ('hostel', 'stay'),
                 'resort': ('resort', 'stay'), 'motel': ('motel', 'stay'), 'chalet': ('chalet', 'stay'),
                 'camp_site': ('camp_site', 'stay'), 'attraction': ('attraction', 'culture')}),
    ('amenity', {'place_of_worship': ('worship', 'culture'), 'marketplace': ('market', 'food'),
                 'restaurant': ('restaurant', 'food'), 'cafe': ('cafe', 'food'), 'food_court': ('food_court', 'food')}),
    ('historic', {'monument': ('monument', 'culture'), 'memorial': ('memorial', 'culture'), 'ruins': ('ruins', 'culture'),
                  'archaeological_site': ('archaeological_site', 'culture'), 'castle': ('palace', 'culture'),
                  'temple': ('temple', 'culture'), 'fort': ('fort', 'culture')}),
    ('waterway', {'waterfall': ('waterfall', 'nature')}),
    ('natural', {'waterfall': ('waterfall', 'nature'), 'beach': ('beach', 'nature'), 'peak': ('peak', 'nature'),
                 'cave_entrance': ('cave', 'nature'), 'hot_spring': ('hot_spring', 'nature'), 'bay': ('bay', 'nature')}),
    ('leisure', {'park': ('park', 'nature'), 'garden': ('garden', 'nature'), 'nature_reserve': ('nature_reserve', 'nature'),
                 'beach_resort': ('resort', 'stay')}),
    ('boundary', {'national_park': ('national_park', 'nature')}),
]
THAI = re.compile(r'[฀-๿]')

def classify(tags):
    for key, values in RULES:
        v = tags.get(key)
        if v in values:
            kind, category = values[v]
            if kind == 'worship':
                kind = 'temple' if tags.get('religion') == 'buddhist' else 'worship'
            return kind, category
    return None

def names(tags):
    name = tags.get('name', '').strip()
    th = tags.get('name:th', '').strip() or (name if THAI.search(name) else '')
    en = tags.get('name:en', '').strip() or (name if name and not THAI.search(name) else '')
    if not (th or en): return None
    return en or th, th or en

def extras(tags):
    out = {}
    for key, short in (('website', 'web'), ('contact:website', 'web'), ('phone', 'tel'), ('contact:phone', 'tel'),
                       ('opening_hours', 'hours'), ('wikidata', 'wd')):
        if tags.get(key) and short not in out: out[short] = tags.get(key)[:200]
    return out

class Collector(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.wkb = osmium.geom.WKBFactory()
        self.places, self.provinces = [], []

    def add(self, oid, tags, lat, lon):
        c = classify(tags)
        if not c: return
        n = names(tags)
        if not n: return
        p = {'id': oid, 'en': n[0], 'th': n[1], 'kind': c[0], 'category': c[1], 'lat': round(lat, 6), 'lon': round(lon, 6)}
        p.update(extras(tags))
        self.places.append(p)

    def node(self, n):
        if n.tags and n.location.valid():
            self.add(f'osm-n{n.id}', dict(n.tags), n.location.lat, n.location.lon)

    def area(self, a):
        tags = dict(a.tags)
        is_province = tags.get('boundary') == 'administrative' and tags.get('admin_level') == '4'
        if not is_province and not (classify(tags) and names(tags)):
            return  # skip buildings, roads, land use… before the costly geometry step
        try:
            geom = shapely_wkb.loads(bytes.fromhex(self.wkb.create_multipolygon(a)))
        except Exception:
            return
        if tags.get('boundary') == 'administrative' and tags.get('admin_level') == '4':
            code = (tags.get('ISO3166-2') or '').replace('TH-', '')
            if code.isdigit():
                self.provinces.append((geom, code, tags.get('name:en', tags.get('name', '')), tags.get('name:th', tags.get('name', ''))))
            return
        # Closed ways and multipolygons (parks, temples drawn as areas): use a point inside the shape.
        pt = geom.representative_point()
        oid = f'osm-w{a.orig_id()}' if a.from_way() else f'osm-r{a.orig_id()}'
        self.add(oid, tags, pt.y, pt.x)

def main(src, dst):
    t0 = time.time()
    h = Collector()
    h.apply_file(src, locations=True, idx='flex_mem')
    print(f'read {len(h.places):,} candidate places, {len(h.provinces)} provinces in {time.time()-t0:.0f}s', file=sys.stderr)

    tree = STRtree([g for g, *_ in h.provinces])
    seen, kept, outside = set(), 0, 0
    counts = {}
    with gzip.open(dst, 'wt', encoding='utf-8') as out:
        for p in h.places:
            key = (p['en'].lower(), round(p['lat'], 4), round(p['lon'], 4))
            if key in seen: continue  # same place mapped twice (node + area)
            seen.add(key)
            pt = Point(p['lon'], p['lat'])
            hit = next((i for i in tree.query(pt) if h.provinces[i][0].covers(pt)), None)
            if hit is None:
                outside += 1  # in the extract's border margin (Laos, Myanmar, sea)
                continue
            _, code, pen, pth = h.provinces[hit]
            p.update({'province': 'TH-' + code, 'provinceEn': re.sub(r'\s+Province$', '', pen), 'provinceTh': pth, 'region': region_for(code)})
            out.write(json.dumps(p, ensure_ascii=False, separators=(',', ':')) + '\n')
            kept += 1
            counts[(p['region'], p['category'])] = counts.get((p['region'], p['category']), 0) + 1
    print(f'kept {kept:,} places in Thailand ({outside:,} outside the border skipped) in {time.time()-t0:.0f}s', file=sys.stderr)
    for k in sorted(counts): print(f'  {k[0]:10} {k[1]:8} {counts[k]:>7,}', file=sys.stderr)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
