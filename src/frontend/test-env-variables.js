// Test script to check if frontend environment variables are loaded correctly
const path = require('path');
const fs = require('fs');

console.log('🔍 Testing Frontend Environment Variables...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envLocalPath = path.join(__dirname, '.env.local');

console.log('📁 File Check:');
console.log(`  .env exists: ${fs.existsSync(envPath)}`);
console.log(`  .env.local exists: ${fs.existsSync(envLocalPath)}`);

// Load environment variables manually
require('dotenv').config({ path: envPath });
require('dotenv').config({ path: envLocalPath });

console.log('\n🔧 Environment Variables:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`  NEXT_PUBLIC_API_BASE_URL: ${process.env.NEXT_PUBLIC_API_BASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`  NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL ? '✅ Set' : '❌ Missing'}`);

// Show actual values (masked for security)
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log(`    Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
}
if (process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.log(`    API Base URL: ${process.env.NEXT_PUBLIC_API_BASE_URL}`);
}

console.log('\n🌐 API Connectivity Test:');

// Test backend API
const testBackendAPI = async () => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    console.log(`  Testing backend API at: ${apiUrl}`);
    
    const response = await fetch(`${apiUrl}/api/songs/random?limit=2`);
    console.log(`  Backend API Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  Backend API Response: ${data.length} songs received`);
      if (data.length > 0) {
        console.log(`    Sample song: "${data[0].title}" by ${data[0].artist}`);
      }
    } else {
      console.log(`  Backend API Error: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`  Backend API Error: ${error.message}`);
  }
};

// Test Supabase connection
const testSupabaseConnection = async () => {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('  Supabase: ❌ Missing environment variables');
      return;
    }
    
    console.log('  Testing Supabase connection...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase
      .from('songs')
      .select('id, title, artist')
      .limit(2);
    
    if (error) {
      console.log(`  Supabase Error: ${error.message}`);
    } else {
      console.log(`  Supabase Status: ✅ Connected`);
      console.log(`  Supabase Response: ${data.length} songs found`);
      if (data.length > 0) {
        console.log(`    Sample song: "${data[0].title}" by ${data[0].artist}`);
      }
    }
  } catch (error) {
    console.log(`  Supabase Error: ${error.message}`);
  }
};

// Run tests
const runTests = async () => {
  await testBackendAPI();
  await testSupabaseConnection();
  
  console.log('\n📊 Summary:');
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasAPI = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  console.log(`  Environment Variables: ${hasSupabase && hasAPI ? '✅ Complete' : '❌ Incomplete'}`);
  console.log(`  Backend API: ${hasAPI ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  Supabase: ${hasSupabase ? '✅ Configured' : '❌ Missing'}`);
  
  if (!hasSupabase || !hasAPI) {
    console.log('\n⚠️  Issues Found:');
    if (!hasAPI) console.log('  - NEXT_PUBLIC_API_BASE_URL is missing');
    if (!hasSupabase) console.log('  - Supabase credentials are missing');
    console.log('\n💡 Solution: Check your .env file and ensure all required variables are set.');
  } else {
    console.log('\n✅ All environment variables are properly configured!');
  }
};

runTests().catch(console.error);
