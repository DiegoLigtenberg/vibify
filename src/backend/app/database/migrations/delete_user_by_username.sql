-- Generic RPC function to delete any user by username
-- This function can be used at any time to delete user accounts
CREATE OR REPLACE FUNCTION public.delete_user_by_username(username_input VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    result_json JSONB;
BEGIN
    -- Check if username exists
    SELECT id, username, created_at INTO user_record FROM public.users WHERE username = username_input;

    IF user_record.id IS NULL THEN
        RETURN '{"success": false, "error": "Username not found"}'::JSONB;
    END IF;

    -- Delete the user
    DELETE FROM public.users WHERE username = username_input;

    -- Return success
    result_json := jsonb_build_object(
        'success', true,
        'message', 'User deleted successfully',
        'deleted_user', jsonb_build_object(
            'id', user_record.id,
            'username', user_record.username,
            'created_at', user_record.created_at
        )
    );
    RETURN result_json;
END;
$$;
