#!/usr/bin/env python3
"""
Debug script to check .env file loading
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Get the .env file path
env_path = Path(__file__).parent / '.env'
print(f"Looking for .env at: {env_path}")
print(f"File exists: {env_path.exists()}")

if env_path.exists():
    # Read the file content
    with open(env_path, 'r', encoding='utf-8') as f:
        content = f.read()
        print(f"\nFile content ({len(content)} chars):")
        print("=" * 50)
        print(content)
        print("=" * 50)
        
        # Check each line
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            if 'SUPABASE_URL' in line:
                print(f"\nLine {i} with SUPABASE_URL:")
                print(f"  Raw: {repr(line)}")
                print(f"  Length: {len(line)}")
                print(f"  Stripped: {repr(line.strip())}")
                print(f"  Starts with SUPABASE_URL: {line.strip().startswith('SUPABASE_URL')}")

print(f"\nBefore load_dotenv:")
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")

# Load the .env file
load_dotenv(env_path)

print(f"\nAfter load_dotenv:")
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"B2_APPLICATION_KEY_ID: {os.getenv('B2_APPLICATION_KEY_ID')}")
print(f"SUPABASE_ANON_KEY: {os.getenv('SUPABASE_ANON_KEY')[:20] if os.getenv('SUPABASE_ANON_KEY') else 'None'}...")
