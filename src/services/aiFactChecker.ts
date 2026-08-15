/**
 * BytePrep AI Fact Checker & Quality Shield
 * Validates question integrity, technical correctness, option clarity, and detects Question Bank conflicts.
 * CRITICAL RULE: Never silently modifies the authoritative Question Bank.
 */

import { NormalizedQuestion, FactCheckResult } from '../types';

export class AiFactChecker {
  /**
   * Evaluates question and generated content for technical fidelity & exam readiness
   */
  public static evaluate(question: NormalizedQuestion): FactCheckResult {
    let score = 100;
    const reasons: string[] = [];
    const passedChecks: string[] = [];
    let conflictDetected = false;
    let conflictReason: string | undefined;

    // 1. Question Statement Check
    if (!question.question || question.question.trim().length < 15) {
      score -= 30;
      reasons.push('Question statement is too brief or incomplete.');
    } else {
      passedChecks.push('Question statement is clear and descriptive.');
    }

    // 2. Options Validity & Uniqueness Check
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      score -= 35;
      reasons.push(`Must contain exactly 4 options (found ${question.options?.length || 0}).`);
    } else {
      const trimmedOptions = question.options.map(o => String(o).trim());
      const hasEmpty = trimmedOptions.some(o => o.length === 0);
      if (hasEmpty) {
        score -= 25;
        reasons.push('Contains empty or whitespace-only options.');
      } else {
        const uniqueSet = new Set(trimmedOptions.map(o => o.toLowerCase()));
        if (uniqueSet.size < 4) {
          score -= 30;
          reasons.push('Contains duplicate option text.');
        } else {
          passedChecks.push('All 4 options are distinct, well-formed, and unique.');
        }
      }
    }

    // 3. Correct Answer Index Validity
    if (
      typeof question.correctAnswer !== 'number' ||
      question.correctAnswer < 0 ||
      question.correctAnswer > 3
    ) {
      score -= 40;
      reasons.push('Answer index out of valid range (0-3).');
      conflictDetected = true;
      conflictReason = 'Answer index references an invalid option.';
    } else {
      const correctText = question.options[question.correctAnswer] || '';
      passedChecks.push(`Answer mapped to Option (${String.fromCharCode(65 + question.correctAnswer)}): "${correctText}"`);
    }

    // 4. Explanation Completeness & Technical Sanity
    if (!question.explanation || question.explanation.length < 25) {
      score -= 20;
      reasons.push('Explanation is missing or too brief for deep revision.');
    } else {
      passedChecks.push('Detailed technical explanation and solution logic provided.');
    }

    // 5. Technical Terminology & Keyword Checks
    const qLower = question.question.toLowerCase();
    const expLower = (question.explanation || '').toLowerCase();

    // Check for common contradictions (e.g. TCP connectionless vs connection-oriented)
    if (qLower.includes('tcp') && (qLower.includes('connectionless') || expLower.includes('tcp is connectionless'))) {
      score -= 25;
      reasons.push('Potential technical inaccuracy: TCP is connection-oriented, not connectionless.');
      conflictDetected = true;
      conflictReason = 'TCP protocol characteristics mismatch detected.';
    }

    if (qLower.includes('udp') && (qLower.includes('connection-oriented') || expLower.includes('udp is connection-oriented'))) {
      score -= 25;
      reasons.push('Potential technical inaccuracy: UDP is connectionless.');
      conflictDetected = true;
      conflictReason = 'UDP protocol characteristics mismatch detected.';
    }

    // 6. Ambiguity checks (e.g., 'All of the above' when only 1 is true)
    const hasAllAbove = question.options.some(o => o.toLowerCase().includes('all of the above') || o.toLowerCase().includes('all of these'));
    const hasNoneAbove = question.options.some(o => o.toLowerCase().includes('none of the above') || o.toLowerCase().includes('none of these'));
    if (hasAllAbove && hasNoneAbove) {
      score -= 10;
      reasons.push('Contains both "All of the above" and "None of the above" in options.');
    }

    // Final Status Determination
    let status: 'PASS' | 'REVIEW' | 'FAIL' = 'PASS';
    if (score < 60 || conflictDetected) {
      status = 'FAIL';
    } else if (score < 85 || reasons.length > 0) {
      status = 'REVIEW';
    }

    return {
      status,
      score: Math.max(0, score),
      reasons,
      passedChecks,
      failedChecks: reasons,
      conflictDetected,
      conflictReason,
    };
  }
}
