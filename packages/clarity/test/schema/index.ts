import skill from './skill.type'
import summary from './summary.type'
import link from './link.type'
import experience from './experience.type'
import project from './project.type'
import education from './education.type'
import legal from './legal.type'

export const schemaTypes = [
  skill, summary, link, experience, project, education, legal
]
console.log(JSON.stringify(schemaTypes))

export default schemaTypes
