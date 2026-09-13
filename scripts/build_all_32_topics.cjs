// scripts/build_all_32_topics.js
const fs = require('fs');
const path = require('path');

const coaDigital = require('./topics_coa_digital.cjs');
const osTopics = require('./topics_os.cjs');
const dsaTopics = require('./topics_dsa.cjs');
const dbmsTopics = require('./topics_dbms.cjs');
const netTopics = require('./topics_networks.cjs');
const progSeTopics = require('./topics_programming_se.cjs');

const outDir = path.join(__dirname, '..', 'src', 'data', 'questions');

const filesToGenerate = [
  {
    fileName: 'dsssb_coa_digital.json',
    topics: [
      { name: 'Computer System Architecture & Organization', data: coaDigital.topic1 },
      { name: 'Digital Logic & Boolean Algebra', data: coaDigital.topic7 },
      { name: 'Combinational & Sequential Circuits', data: coaDigital.topic8 },
      { name: 'Number Systems & Computer Arithmetic', data: coaDigital.topic9 },
    ]
  },
  {
    fileName: 'dsssb_operating_systems.json',
    topics: [
      { name: 'Operating System Fundamentals', data: osTopics.topic2 },
      { name: 'Process Management & CPU Scheduling', data: osTopics.topic3 },
      { name: 'Process Synchronization & Deadlocks', data: osTopics.topic4 },
      { name: 'Memory Management & Virtual Memory', data: osTopics.topic5 },
      { name: 'File Systems & Disk Scheduling', data: osTopics.topic6 },
    ]
  },
  {
    fileName: 'dsssb_data_structures_algorithms.json',
    topics: [
      { name: 'Data Structures: Arrays & Strings', data: dsaTopics.topic10 },
      { name: 'Data Structures: Stacks & Queues', data: dsaTopics.topic11 },
      { name: 'Data Structures: Linked Lists', data: dsaTopics.topic12 },
      { name: 'Data Structures: Trees & Binary Search Trees', data: dsaTopics.topic13 },
      { name: 'Advanced Trees: AVL & B-Trees', data: dsaTopics.topic14 },
      { name: 'Data Structures: Graphs', data: dsaTopics.topic15 },
      { name: 'Algorithms & Asymptotic Complexity', data: dsaTopics.topic16 },
      { name: 'Searching & Sorting Algorithms', data: dsaTopics.topic17 },
      { name: 'Graph Algorithms & Dynamic Programming', data: dsaTopics.topic18 },
    ]
  },
  {
    fileName: 'dsssb_dbms.json',
    topics: [
      { name: 'Database Management Systems & ER Model', data: dbmsTopics.topic19 },
      { name: 'Relational Model & Relational Algebra', data: dbmsTopics.topic20 },
      { name: 'SQL & Query Optimization', data: dbmsTopics.topic21 },
      { name: 'Database Normalization (1NF to BCNF)', data: dbmsTopics.topic22 },
      { name: 'Transactions & Concurrency Control', data: dbmsTopics.topic23 },
    ]
  },
  {
    fileName: 'dsssb_computer_networks.json',
    topics: [
      { name: 'Computer Networks: OSI & TCP/IP Models', data: netTopics.topic24 },
      { name: 'Physical & Data Link Layers', data: netTopics.topic25 },
      { name: 'Network Layer & IP Addressing (IPv4/IPv6)', data: netTopics.topic26 },
      { name: 'Transport Layer (TCP, UDP, Congestion Control)', data: netTopics.topic27 },
      { name: 'Application Layer & Network Security', data: netTopics.topic28 },
    ]
  },
  {
    fileName: 'dsssb_programming_software_eng.json',
    topics: [
      { name: 'Programming in C & C++', data: progSeTopics.topic29 },
      { name: 'Object-Oriented Programming (OOP) Concepts', data: progSeTopics.topic30 },
      { name: 'Python Programming & Scripting', data: progSeTopics.topic31 },
      { name: 'Software Engineering & Testing', data: progSeTopics.topic32 },
    ]
  }
];

let allQuestions = [];
let totalTopicsCount = 0;
const seenIds = new Set();

for (const group of filesToGenerate) {
  let groupQuestions = [];
  for (const t of group.topics) {
    totalTopicsCount++;
    if (!t.data || t.data.length !== 20) {
      console.error(`ERROR: Topic "${t.name}" has ${t.data ? t.data.length : 0} questions, expected exactly 20!`);
      process.exit(1);
    }
    for (const q of t.data) {
      if (seenIds.has(q.id)) {
        console.error(`ERROR: Duplicate question ID found: ${q.id}`);
        process.exit(1);
      }
      seenIds.add(q.id);
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || q.correctAnswer < 0 || q.correctAnswer > 3 || !q.explanation) {
        console.error(`ERROR: Invalid question structure for ID: ${q.id}`);
        process.exit(1);
      }
      groupQuestions.push(q);
      allQuestions.push(q);
    }
  }
  const filePath = path.join(outDir, group.fileName);
  fs.writeFileSync(filePath, JSON.stringify(groupQuestions, null, 2), 'utf-8');
  console.log(`Wrote ${groupQuestions.length} questions across ${group.topics.length} topics to ${group.fileName}`);
}

console.log(`\n========================================`);
console.log(`TOTAL TOPICS VERIFIED: ${totalTopicsCount} (Expected: 32)`);
console.log(`TOTAL QUESTIONS VERIFIED: ${allQuestions.length} (Expected: 640)`);
console.log(`ALL 32 TOPICS HAVE EXACTLY 20 QUESTIONS EACH!`);
console.log(`========================================\n`);
