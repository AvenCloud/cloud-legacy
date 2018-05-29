require('dotenv').config();

export const useTestClient = process.env.NODE_ENV === 'test'; // todo, test both clients
