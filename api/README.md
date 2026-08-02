# VeriPanel Search API (JavaScript)

Node.js API that searches all files inside the `databases/` folder.

## Supported formats

- `.json`
- `.jsonl` / `.ndjson`
- `.csv` / `.tsv`
- `.txt`
- `.xlsx` / `.xls`

Drop files into `databases/` (subfolders allowed). The API indexes and searches them.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/database?key=KEY` | File + record stats |
| GET | `/api/files?key=KEY` | Same as database stats |
| GET | `/api/search?q=QUERY&key=KEY` | Search all databases |
| POST | `/api/reload?key=KEY` | Clear cache and reload files |

## Run locally

```bash
cd api
npm install
npm start
npm test
```

## Deploy to server

```bash
cd api
python3 deploy.py
```

Default API key: `z2GFltjwp4rgccrOJdtc` (set `API_KEY` env var to change).

## Example

```bash
curl "http://109.71.252.128:8080/api/search?q=05551234567&key=z2GFltjwp4rgccrOJdtc"
```
