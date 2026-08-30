import asyncio
import sys
import os

# Add gestro to path
sys.path.append(r"d:\myWork\gestro")

from app.services.supabase_client import get_async_supabase

async def main():
    client = await get_async_supabase()
    ch = client.channel('test')
    print('CH attributes:', dir(ch))

if __name__ == "__main__":
    asyncio.run(main())
