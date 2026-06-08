import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oneajaiiyexdihdwbuis.supabase.co';
const supabaseKey = 'sb_publishable_PNl7xNcjcU5_xJAOOxgK2A_EKlRQSKO';

export const supabase = createClient(supabaseUrl, supabaseKey);