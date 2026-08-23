import os
import zipfile
import requests
from dotenv import load_dotenv

load_dotenv('D:/myWork/gestro/.env.local')
URL = os.environ.get("SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

BUCKET_NAME = "releases"

headers = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json"
}

# 1. Create Bucket if not exists
bucket_url = f"{URL}/storage/v1/bucket"
r = requests.get(bucket_url, headers=headers)
buckets = [b['name'] for b in r.json()]
if BUCKET_NAME not in buckets:
    print(f"Creating bucket {BUCKET_NAME}...")
    requests.post(bucket_url, headers=headers, json={"id": BUCKET_NAME, "name": BUCKET_NAME, "public": True})
else:
    # Ensure it's public
    requests.put(f"{bucket_url}/{BUCKET_NAME}", headers=headers, json={"public": True})

def zipdir(path, ziph):
    for root, dirs, files in os.walk(path):
        for file in files:
            ziph.write(os.path.join(root, file), 
                       os.path.relpath(os.path.join(root, file), 
                                       os.path.join(path, '..')))

# 2. Zip Gestro
dist_folder = "D:/myWork/gestro/dist/Gestro"
zip_name = "Gestro-Windows.zip"
if os.path.exists(dist_folder):
    print("Zipping Gestro-Windows...")
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipdir(dist_folder, zipf)

# 3. Upload file
def upload_file(filename):
    if not os.path.exists(filename):
        print(f"File {filename} not found!")
        return

    print(f"Uploading {filename} to Supabase...")
    with open(filename, 'rb') as f:
        upload_headers = {
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/zip" if filename.endswith('.zip') else "application/vnd.android.package-archive"
        }
        res = requests.post(f"{URL}/storage/v1/object/{BUCKET_NAME}/{filename}", headers=upload_headers, data=f)
        if res.status_code in [200, 201]:
            print(f"Successfully uploaded {filename}!")
        elif res.status_code == 400 and 'Duplicate' in res.text:
            print("File exists, overwriting...")
            res = requests.put(f"{URL}/storage/v1/object/{BUCKET_NAME}/{filename}", headers=upload_headers, data=f)
            if res.status_code == 200:
                print(f"Successfully overwritten {filename}!")
            else:
                print(f"Failed to overwrite: {res.text}")
        else:
            print(f"Failed to upload: {res.text}")

upload_file(zip_name)
public_url = f"{URL}/storage/v1/object/public/{BUCKET_NAME}/{zip_name}"
print(f"\\nPublic Download Link for Windows: {public_url}")
