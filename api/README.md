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
| GET | `/api/stats` | Line counts only |
| GET | `/api/database` | Record count + status |
| GET | `/api/search?q=QUERY` | Search all databases |
| POST | `/api/reload` | Clear cache and reload files |

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

## Example

```bash
curl "http://109.71.252.128:8080/api/stats"
curl "http://109.71.252.128:8080/api/search?q=05551234567"
```
