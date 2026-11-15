// Nama pemilik "telinga". Bisa diganti lewat client/.env -> VITE_OWNER_NAME=Namamu
export const OWNER_NAME = import.meta.env.VITE_OWNER_NAME || 'Yeyo';

export const LIMITS = {
  body: 1000,
  name: 40,
  reply: 1000,
};
