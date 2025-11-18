import { parseAsyncAPIOutput } from './test/utils/test-helpers.js'

async function testFilesystem() {
  try {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')

async function testFilesystem() {
  try {
    const typeSpecOutputDir = path.join(process.cwd(), '@lars-artmann', 'typespec-asyncapi')
    console.log('Checking directory:', typeSpecOutputDir)
    
    const files = await fs.readdir(typeSpecOutputDir)
    console.log('Files found:', files)
    
    const asyncapiFiles = files.filter(file => 
      file.includes('asyncapi') && 
      (file.endsWith('.yaml') || file.endsWith('.json'))
    )
    console.log('AsyncAPI files:', asyncapiFiles)
    
    if (asyncapiFiles.length > 0) {
      const filePath = path.join(typeSpecOutputDir, asyncapiFiles[0])
      const content = await fs.readFile(filePath, 'utf-8')
      console.log('File content length:', content.length)
      
      const outputFiles = new Map([[asyncapiFiles[0], content]])
      const parsed = await parseAsyncAPIOutput(outputFiles, asyncapiFiles[0])
      console.log('Parsed version:', parsed?.asyncapi)
      console.log('Channels:', parsed?.channels ? Object.keys(parsed.channels).length : 0)
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testFilesystem()