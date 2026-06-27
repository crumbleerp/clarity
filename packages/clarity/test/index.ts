import { createClient } from '../dist'
import schema from './schema'

const client = createClient({
  endpoint: 'https://clarity.xlsft.ru',
  dataset: 'cv',
  schema
})

console.log(await client.fetch('*'))
