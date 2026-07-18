#!/usr/bin/env node
import { buildProgram } from './program.js';
import { ConfirmationRequiredError } from './confirm.js';

async function main(): Promise<void> {
  const program = buildProgram();
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof ConfirmationRequiredError) {
      console.error(`✖ ${err.message}`);
      process.exit(2);
    }
    console.error(`✖ ${(err as Error).message}`);
    process.exit(1);
  }
}

void main();
