const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '/Users/alibourak/Documents/CodingProjects/StemoryBlooms/packages/database/.env' });
const sql = neon(process.env.DATABASE_URL);
sql('SELECT column_name FROM information_schema.columns WHERE table_name = \'SiteSettings\'')
  .then(res => console.log(res))
  .catch(console.error);
