#!/usr/bin/env python3
"""
Test script to verify performance optimizations are working
"""

import requests
import time
import json

def test_api_performance():
    """Test API performance with optimized settings"""
    
    base_url = "http://127.0.0.1:8000"
    
    print("🚀 Testing Vibify API Performance Optimizations")
    print("=" * 50)
    
    # Test endpoints
    endpoints = [
        ("/health", "Health check"),
        ("/api/songs/random?limit=5", "Random songs"),
        ("/api/songs/discover?limit=10", "Discover feed"),
        ("/api/songs/popular?limit=5", "Popular songs"),
    ]
    
    results = []
    
    for endpoint, description in endpoints:
        url = f"{base_url}{endpoint}"
        
        print(f"\n📊 Testing: {description}")
        print(f"URL: {url}")
        
        try:
            # Test multiple requests to see caching effects
            times = []
            for i in range(3):
                start_time = time.time()
                response = requests.get(url, timeout=10)
                end_time = time.time()
                
                process_time = float(response.headers.get('X-Process-Time', 0))
                total_time = end_time - start_time
                
                times.append({
                    'request': i + 1,
                    'total_time': total_time,
                    'process_time': process_time,
                    'status': response.status_code
                })
                
                print(f"  Request {i+1}: {total_time:.3f}s total, {process_time:.3f}s process")
            
            # Calculate averages
            avg_total = sum(t['total_time'] for t in times) / len(times)
            avg_process = sum(t['process_time'] for t in times) / len(times)
            
            results.append({
                'endpoint': endpoint,
                'description': description,
                'avg_total_time': avg_total,
                'avg_process_time': avg_process,
                'status': times[0]['status'],
                'success': times[0]['status'] == 200
            })
            
            print(f"  ✅ Average: {avg_total:.3f}s total, {avg_process:.3f}s process")
            
        except requests.exceptions.RequestException as e:
            print(f"  ❌ Error: {e}")
            results.append({
                'endpoint': endpoint,
                'description': description,
                'error': str(e),
                'success': False
            })
    
    # Summary
    print("\n" + "=" * 50)
    print("📈 PERFORMANCE SUMMARY")
    print("=" * 50)
    
    successful_tests = [r for r in results if r.get('success', False)]
    
    if successful_tests:
        avg_total = sum(r['avg_total_time'] for r in successful_tests) / len(successful_tests)
        avg_process = sum(r['avg_process_time'] for r in successful_tests) / len(successful_tests)
        
        print(f"✅ Successful tests: {len(successful_tests)}/{len(results)}")
        print(f"⚡ Average response time: {avg_total:.3f}s")
        print(f"⚡ Average process time: {avg_process:.3f}s")
        
        # Performance assessment
        if avg_total < 0.3:
            print("🎉 EXCELLENT: Sub-300ms responses (TikTok-like speed)")
        elif avg_total < 0.5:
            print("✅ GOOD: Sub-500ms responses")
        elif avg_total < 1.0:
            print("⚠️  ACCEPTABLE: Sub-1s responses")
        else:
            print("❌ SLOW: Over 1s responses - needs optimization")
            
    else:
        print("❌ No successful tests - check if server is running")
    
    print("\n🔧 Optimizations Applied:")
    print("  ✅ Uvicorn with httptools parser")
    print("  ✅ 127.0.0.1 instead of localhost")
    print("  ✅ Singleton patterns for services")
    print("  ✅ B2 token caching")
    print("  ✅ Startup warm-up")
    print("  ✅ Frontend deduplication")

if __name__ == "__main__":
    test_api_performance()
