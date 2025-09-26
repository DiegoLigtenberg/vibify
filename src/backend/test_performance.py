#!/usr/bin/env python3
"""
Test API performance after optimizations
"""

import requests
import time

def test_api_performance():
    """Test API performance"""
    
    print("🚀 Testing API Performance After Optimizations")
    print("=" * 50)
    
    # Test discover endpoint
    print("1. Testing /api/songs/discover endpoint...")
    start_time = time.time()
    
    try:
        response = requests.get('http://127.0.0.1:8000/api/songs/discover?limit=48&cursor=0')
        end_time = time.time()
        
        total_time = (end_time - start_time) * 1000
        process_time = response.headers.get('X-Process-Time', 'N/A')
        
        print(f"   ✅ Status: {response.status_code}")
        print(f"   ⏱️  Total time: {total_time:.2f}ms")
        print(f"   ⚡ Process time: {process_time}s")
        
        if response.status_code == 200:
            data = response.json()
            songs = data.get('songs', [])
            print(f"   📊 Returned {len(songs)} songs")
            print(f"   🔄 Next cursor: {data.get('next_cursor', 'N/A')}")
            print(f"   ➡️  Has more: {data.get('has_more', 'N/A')}")
            
            # Check if URLs have auth tokens
            if songs:
                song = songs[0]
                storage_url = song.get('storage_url', '')
                thumbnail_url = song.get('thumbnail_url', '')
                
                if 'Authorization=' in storage_url:
                    print(f"   ✅ Storage URL has auth token")
                else:
                    print(f"   ❌ Storage URL missing auth token")
                    
                if 'Authorization=' in thumbnail_url:
                    print(f"   ✅ Thumbnail URL has auth token")
                else:
                    print(f"   ❌ Thumbnail URL missing auth token")
        else:
            print(f"   ❌ Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {e}")
    
    print("\n2. Testing multiple requests...")
    times = []
    for i in range(3):
        start = time.time()
        try:
            response = requests.get(f'http://127.0.0.1:8000/api/songs/discover?limit=48&cursor={i*48}')
            end = time.time()
            times.append((end - start) * 1000)
            print(f"   Request {i+1}: {(end - start) * 1000:.2f}ms")
        except Exception as e:
            print(f"   Request {i+1}: Error - {e}")
    
    if times:
        avg_time = sum(times) / len(times)
        print(f"   📈 Average time: {avg_time:.2f}ms")
        print(f"   🎯 Performance: {'Excellent' if avg_time < 100 else 'Good' if avg_time < 300 else 'Needs improvement'}")

if __name__ == "__main__":
    test_api_performance()
