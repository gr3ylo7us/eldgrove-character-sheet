import { db } from './server/db';
import { archetypes } from './shared/schema';

db.select().from(archetypes).limit(2).then(res => {
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
});
