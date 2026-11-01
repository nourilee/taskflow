import { integrationEnv } from './integration-env.js';
import { prepareTestDatabase } from './test-database.js';

export default function setup() {
  prepareTestDatabase(integrationEnv);
}
