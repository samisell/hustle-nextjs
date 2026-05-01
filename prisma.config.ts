export default {
  client: {
    adapter: 'mysql',
    url: process.env.DATABASE_URL,
  },
  migrate: {
    url: process.env.DATABASE_URL,
  },
}
