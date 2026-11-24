import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const normalized = value => value.toLowerCase().trim().replace(/\s+/g, ' ')
const hash = value => createHash('sha256').update(value).digest('hex')

export async function loadHybrid(directory) {
  const load = name => readFile(join(directory, name), 'utf8')
  const [libraryJson, practiceJson] = await Promise.all([
    load('REVIEWER_LIBRARY.json'), load('PRACTICE_POOL.ndjson')
  ])
  const library = JSON.parse(libraryJson).map(item => ({
    id: item.id, title: item.title, format: item.format,
    role: item.role ?? (/answer key/i.test(item.title) ? 'answer key'
      : /mock exam/i.test(item.title) ? 'mock examination'
      : /lesson|lecture|formula|study notes/i.test(item.title) ? 'lesson or notes' : null),
    subject: item.subject, topic: item.topic, levels: item.exam_levels, editions: item.editions, sources: item.sources
  }))
  const practice = practiceJson.trim().split(/\r?\n/).map(line => {
    const item = JSON.parse(line)
    if (item.eligible_for_scoring !== false) throw new Error('Unexpected scored practice item')
    return {
      id: item.id, stem: item.stem, options: item.options, subject: item.classification?.subject ?? null,
      topic: item.classification?.topic ?? null, levels: item.classification?.exam_levels ?? [],
      provenance: item.provenance, status: item.verification_status, source_answer: item.source_option_label,
      content_key: hash(JSON.stringify([normalized(item.stem), item.options.map(option => normalized(option.text)).sort()]))
    }
  })
  for (const [name, rows] of Object.entries({ library, practice })) {
    if (new Set(rows.map(item => item.id)).size !== rows.length) throw new Error('Duplicate IDs in ' + name)
  }
  if (new Set(practice.map(item => item.content_key)).size !== practice.length) throw new Error('Duplicate practice content')
  return { library, practice }
}

export async function stageHybrid(db, { library, practice }) {
  return db.transaction(async tx => {
    // Each batch uses explicit columns so staging leaves publication flags and permissions intact.
    const execute = async (rows, sql) => {
      let total = 0
      for (let offset = 0; offset < rows.length; offset += 500) {
        const result = await tx.query(sql, [JSON.stringify(rows.slice(offset, offset + 500))])
        total += result.affectedRows
      }
      return total
    }
    const libraryCount = await execute(library, `
      insert into reviewer_private.library (id,title,format,role,subject,topic,levels,editions,sources,searchable)
      select i.id,i.title,i.format,i.role,i.subject,i.topic,i.levels,i.editions,i.sources,
        to_tsvector('simple',concat_ws(' ',i.title,i.role,i.subject,i.topic,array_to_string(i.editions,' '),i.sources::text))
      from jsonb_populate_recordset(null::reviewer_private.library,$1::jsonb) i
      on conflict (id) do nothing`)
    const practiceCount = await execute(practice, `
      insert into reviewer_private.practice (id,stem,options,subject,topic,levels,provenance,status,source_answer,content_key)
      select i.id,i.stem,i.options,i.subject,i.topic,i.levels,i.provenance,i.status,i.source_answer,i.content_key
      from jsonb_populate_recordset(null::reviewer_private.practice,$1::jsonb) i
      on conflict (id) do nothing`)
    return { library: libraryCount, practice: practiceCount }
  })
}
