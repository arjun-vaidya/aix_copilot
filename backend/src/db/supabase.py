from supabase import create_client, Client
from src.core.config import settings

def get_supabase_client() -> Client:
    """
    Returns a configured Supabase client using the service role key to bypass RLS, 
    or the Anon key depending on backend needs. 
    Here we use the standard ANON KEY as requested, though backends often use SERVICE_ROLE for DB admin tasks.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
