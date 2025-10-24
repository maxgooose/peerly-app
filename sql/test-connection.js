// Quick test to verify Supabase connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('✅ .env file loaded');
console.log('✅ Supabase URL:', supabaseUrl);
console.log('✅ Anon Key:', supabaseKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase client created\n');

// Test basic connection
async function testConnection() {
  try {
    console.log('📡 Testing database connection...');

    // Try to list tables (this will work even without data)
    const { data, error } = await supabase
      .from('conversations')
      .select('count', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('relation "conversations" does not exist')) {
        console.log('⚠️  Database table "conversations" does not exist yet');
        console.log('   This is expected! You need to run the SQL migrations first.');
        console.log('   See TESTING_GUIDE.md Part 1\n');
        return false;
      }
      console.error('❌ Database error:', error.message);
      return false;
    }

    console.log('✅ Database connection successful!');
    console.log(`✅ Found ${data?.length || 0} conversations\n`);
    return true;
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('🎉 Everything looks good!');
    console.log('   Next step: Test in the app with `npm start`\n');
  } else {
    console.log('📋 Action needed:');
    console.log('   1. Open Supabase SQL Editor');
    console.log('   2. Run RUN_THIS_IN_SUPABASE.sql');
    console.log('   3. Run CREATE_TEST_DATA.sql');
    console.log('   4. Then run this test again\n');
  }
});
