import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadHybrid, stageHybrid } from './hybrid-import.mjs'

const [input, destination] = process.argv.slice(2)
if (!input || !destination) throw new Error('Supply the private checkpoint directory and a private output directory.')
const statements = []
await stageHybrid({
  transaction: async run => run({
    query: async (statement, [json]) => {
      const hex = Buffer.from(json, 'utf8').toString('hex')
      statements.push(statement.replace('$1', `convert_from(decode('${hex}','hex'),'UTF8')`) + ';')
      return { affectedRows: 0 }
    }
  })
}, await loadHybrid(input))
await mkdir(destination, { recursive: true })
const sql = 'begin;\n' + statements.join('\n') + '\n' +
  'select (select count(*) from reviewer_private.library) as library,' +
  ' (select count(*) from reviewer_private.practice) as practice;\n'
await writeFile(join(destination, 'hybrid-dry-run.sql'), sql + 'rollback;\n')
await writeFile(join(destination, 'hybrid-stage.sql'), sql + 'commit;\n')
console.log('Wrote private staging SQL and rollback-only dry-run SQL.')
