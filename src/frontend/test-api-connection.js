// Simple test to check API connection
const testAPI = async () => {
  console.log('Testing API connection...');
  
  try {
    // Test backend API
    const response = await fetch('http://localhost:8000/api/songs/random?limit=3');
    console.log('Backend API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Backend API data:', data);
    } else {
      console.error('Backend API error:', response.statusText);
    }
  } catch (error) {
    console.error('Backend API connection failed:', error);
  }
  
  try {
    // Test Supabase connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseKey);
    
    if (supabaseUrl && supabaseKey) {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, artist')
        .limit(3);
        
      if (error) {
        console.error('Supabase error:', error);
      } else {
        console.log('Supabase data:', data);
      }
    }
  } catch (error) {
    console.error('Supabase connection failed:', error);
  }
};

testAPI();
