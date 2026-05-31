export interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
  subscription_status: string;
  subscription_until: string | null;
}

export interface ProfileUpdate {
  full_name: string;
  phone_number: string;
}
