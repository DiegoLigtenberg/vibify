from app.database.connection import supabase_client

# Check sample songs
result = supabase_client.supabase.table('songs').select('id, is_public').limit(5).execute()
print('Sample songs:')
for song in result.data:
    print(f'ID: {song["id"]}, is_public: {song.get("is_public", "NULL")}')

print('\nCount of public songs:')
count_result = supabase_client.supabase.table('songs').select('*', count='exact').eq('is_public', True).execute()
print(f'Public songs: {count_result.count}')

print('\nCount of all songs:')
all_count = supabase_client.supabase.table('songs').select('*', count='exact').execute()
print(f'All songs: {all_count.count}')
