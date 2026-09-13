// scripts/generate_dsssb_dataset.js
// Generator for all 32 DSSSB TGT Computer Science topics with 20 questions per topic (640 total questions)
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'src', 'data', 'questions');

// Helpers
function q(id, question, options, correctAnswer, explanation, subject, topic, difficulty = 'medium') {
  return {
    id,
    question,
    options,
    correctAnswer,
    explanation,
    subject,
    topic,
    difficulty,
    exam: 'DSSSB TGT CS'
  };
}

// 1. Computer System Architecture & Organization (20 questions)
const topic1_coa = [
  q('coa_01', 'In the Von Neumann architecture, which register holds the address of the next instruction to be fetched from memory?',
    ['Instruction Register (IR)', 'Program Counter (PC)', 'Memory Buffer Register (MBR)', 'Accumulator (AC)'], 1,
    'The Program Counter (PC) stores the memory address of the next machine instruction to be executed by the CPU.', 'Computer Architecture', 'Computer System Architecture & Organization', 'easy'),
  q('coa_02', 'Which type of cache mapping allows a memory block to be placed anywhere in the cache?',
    ['Direct Mapping', 'Associative Mapping', 'Set-Associative Mapping', 'Sector Mapping'], 1,
    'In fully associative mapping, any block of main memory can be placed in any cache slot, minimizing conflict misses.', 'Computer Architecture', 'Computer System Architecture & Organization', 'medium'),
  q('coa_03', 'What is the main purpose of the Memory Address Register (MAR)?',
    ['Holds the instruction currently being executed', 'Holds the memory address of data/instruction to be accessed', 'Holds temporary ALU calculation results', 'Holds the status flags of the processor'], 1,
    'MAR (Memory Address Register) holds the address of the memory location currently being read from or written to.', 'Computer Architecture', 'Computer System Architecture & Organization', 'easy'),
  q('coa_04', 'In a 5-stage instruction pipeline (IF, ID, EX, MEM, WB), what hazard occurs when an instruction depends on the result of a previous instruction still in the pipeline?',
    ['Structural Hazard', 'Data Hazard', 'Control Hazard', 'Branch Hazard'], 1,
    'Data hazards (RAW, WAR, WAW) occur when instructions exhibit data dependencies and their operands are not yet available.', 'Computer Architecture', 'Computer System Architecture & Organization', 'medium'),
  q('coa_05', 'Which bus in a computer system is unidirectional?',
    ['Data Bus', 'Control Bus', 'Address Bus', 'System Bus'], 2,
    'The Address Bus is unidirectional; the CPU sends memory or I/O addresses outward to select devices or memory cells.', 'Computer Architecture', 'Computer System Architecture & Organization', 'easy'),
  q('coa_06', 'What technique allows an I/O device to transfer data directly to/from main memory without continuous CPU intervention?',
    ['Programmed I/O', 'Interrupt-driven I/O', 'Direct Memory Access (DMA)', 'Polling'], 2,
    'DMA (Direct Memory Access) allows high-speed peripheral devices to transfer blocks of data directly to memory, freeing the CPU.', 'Computer Architecture', 'Computer System Architecture & Organization', 'easy'),
  q('coa_07', 'In RISC (Reduced Instruction Set Computer) architecture, which characteristic is typically observed?',
    ['Variable instruction length', 'Heavy use of microprogrammed control units', 'Fixed instruction format and single-cycle execution', 'Complex multi-operand memory-to-memory instructions'], 2,
    'RISC processors use fixed-length instructions, load/store architecture, hardwired control, and mostly single-cycle execution.', 'Computer Architecture', 'Computer System Architecture & Organization', 'medium'),
  q('coa_08', 'What is the write policy where data is updated simultaneously in both cache and main memory?',
    ['Write-back', 'Write-through', 'Write-allocate', 'No-write-allocate'], 1,
    'In Write-Through policy, every cache write updates both the cache block and the corresponding main memory location.', 'Computer Architecture', 'Computer System Architecture & Organization', 'easy'),
  q('coa_09', 'Which addressing mode specifies the operand directly within the instruction itself?',
    ['Immediate Addressing', 'Direct Addressing', 'Register Indirect Addressing', 'Indexed Addressing'], 0,
    'In Immediate Addressing Mode, the operand value is part of the instruction itself (e.g., MOV R1, #25).', 'Computer Architecture', 'Computer System Architecture & Organization', 'easy'),
  q('coa_10', 'Booth’s algorithm is specifically designed for which arithmetic operation?',
    ['Division of unsigned numbers', 'Multiplication of signed 2’s complement binary numbers', 'Floating-point normalization', 'BCD addition'], 1,
    'Booth’s multiplication algorithm efficiently multiplies two signed binary numbers in 2’s complement representation.', 'Computer Architecture', 'Computer System Architecture & Organization', 'medium'),
  q('coa_11', 'Which component generates clock signals and control signals to sequence all CPU operations?',
    ['Arithmetic Logic Unit (ALU)', 'Control Unit (CU)', 'Bus Interface Unit', 'Cache Controller'], 1,
    'The Control Unit (CU) coordinates and directs the operations of all processor units by generating timing and control signals.', 'Computer Architecture', 'Computer System Architecture & Organization', 'easy'),
  q('coa_12', 'What is the primary trade-off of a microprogrammed control unit compared to a hardwired control unit?',
    ['Higher speed but higher hardware cost', 'Flexibility and ease of modification at the cost of slower execution speed', 'Inability to execute complex CISC instructions', 'Requires no ROM or memory space'], 1,
    'Microprogrammed control units are flexible and easier to update via microcode, but are slower than hardwired logic.', 'Computer Architecture', 'Computer System Architecture & Organization', 'medium'),
  q('coa_13', 'If a cache has a hit ratio of 90%, cache access time is 2 ns, and main memory access time is 50 ns, what is the effective memory access time?',
    ['5.2 ns', '7.0 ns', '6.8 ns', '52 ns'], 2,
    'Effective Access Time = (0.90 * 2 ns) + (0.10 * 52 ns) = 1.8 + 5.2 = 7.0 ns (or if parallel: 0.9*2 + 0.1*(2+50) = 7.0 ns).', 'Computer Architecture', 'Computer System Architecture & Organization', 'hard'),
  q('coa_14', 'What is the function of the Instruction Register (IR)?',
    ['Points to the next memory address', 'Stores the instruction currently being decoded and executed', 'Stores arithmetic carry flag', 'Stores the base address of the stack'], 1,
    'The Instruction Register (IR) holds the binary opcode and operands of the instruction fetched from memory.', 'Computer Architecture', 'Computer System Architecture & Organization', 'easy'),
  q('coa_15', 'In Harvard architecture, what distinguishes it from Von Neumann architecture?',
    ['Separate physical memories and buses for instructions and data', 'Unified memory for instructions and data', 'Absence of ALU', 'Use of only serial data transfer'], 0,
    'Harvard architecture provides physically separate memory storage and signal pathways for instructions and data.', 'Computer Architecture', 'Computer System Architecture & Organization', 'easy'),
  q('coa_16', 'Which interrupt has the highest priority and cannot be ignored by the processor?',
    ['Maskable Interrupt', 'Non-Maskable Interrupt (NMI)', 'Software Interrupt', 'Timer Interrupt'], 1,
    'Non-Maskable Interrupts (NMI) are reserved for critical hardware events (like power failure or parity error) and cannot be masked.', 'Computer Architecture', 'Computer System Architecture & Organization', 'easy'),
  q('coa_17', 'What is the principle of Locality of Reference in memory systems?',
    ['Tendency of processors to access memory uniformly across the entire address space', 'Tendency of processors to access instructions and data close in time or memory location', 'Writing data only to primary storage', 'Using virtual addresses exclusively'], 1,
    'Locality of reference includes temporal locality (recently accessed items accessed again soon) and spatial locality (nearby addresses accessed soon).', 'Computer Architecture', 'Computer System Architecture & Organization', 'easy'),
  q('coa_18', 'Which unit in the CPU performs bitwise AND, OR, and arithmetic additions?',
    ['MMU', 'ALU', 'FPU', 'Control Unit'], 1,
    'The Arithmetic Logic Unit (ALU) performs fundamental arithmetic operations (add, sub) and bitwise logic operations (AND, OR, NOT).', 'Computer Architecture', 'Computer System Architecture & Organization', 'easy'),
  q('coa_19', 'What is pipelining throughput in an ideal k-stage pipeline operating on n tasks?',
    ['Each task completes in k clock cycles always', 'Approximately one task completes per clock cycle after the pipeline fills', 'Requires n*k clock cycles total', 'Cannot overlap instruction phases'], 1,
    'Once an ideal pipeline is filled, one instruction finishes per clock cycle, yielding an ideal speedup of k.', 'Computer Architecture', 'Computer System Architecture & Organization', 'medium'),
  q('coa_20', 'Which register contains the condition codes (Zero flag, Carry flag, Sign flag, Overflow flag)?',
    ['Accumulator', 'Program Status Word (PSW) / Flags Register', 'Instruction Register', 'Base Register'], 1,
    'The Program Status Word (PSW) or Flags register holds status indicators reflecting ALU operation outcomes.', 'Computer Architecture', 'Computer System Architecture & Organization', 'easy'),
];

console.log('Topic 1 ready:', topic1_coa.length);
module.exports = { q, topic1_coa };
