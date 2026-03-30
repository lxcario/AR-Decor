import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

interface GenerationInput {
  imageUrl: string;
  dimensions: { widthM: number; heightM: number; depthM: number };
  depthMultiplier: number;
  strategy: 'depth_mesh' | 'flat_plane';
  placement?: 'floor' | 'wall';
  productId: string;
}

interface GenerationResult {
  glbPath: string;
  strategy: string;
}

const GENERATION_TIMEOUT_MS = 120_000;

async function safeDelete(path: string) {
  await rm(path, { force: true }).catch(() => undefined);
}

async function downloadImage(imageUrl: string, destinationPath: string) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error('IMAGE_DOWNLOAD_FAILED');
  }

  const arrayBuffer = await response.arrayBuffer();
  await writeFile(destinationPath, Buffer.from(arrayBuffer));
}

function getPythonCommand() {
  return process.env.PYTHON_PATH ?? 'python';
}

function getTempDir() {
  return resolve(process.cwd(), process.env.TEMP_DIR ?? './tmp');
}

function getScriptPath(strategy: GenerationInput['strategy']) {
  const scriptName = strategy === 'depth_mesh' ? 'generate_depth_model.py' : 'generate_flat_plane.py';
  return resolve(process.cwd(), '../scripts', scriptName);
}

function buildArgs(input: GenerationInput, sourceImagePath: string, outputPath: string) {
  const args = [
    '--image',
    sourceImagePath,
    '--width',
    input.dimensions.widthM.toString(),
    '--height',
    input.dimensions.heightM.toString(),
    '--depth',
    input.dimensions.depthM.toString(),
    '--depth-multiplier',
    input.depthMultiplier.toString(),
  ];

  if (input.strategy === 'flat_plane') {
    args.push('--placement', input.placement ?? 'floor');
  }

  args.push('--output', outputPath);
  return args;
}

function runPython(scriptPath: string, args: string[]) {
  return new Promise<string>((resolvePromise, rejectPromise) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    let timedOut = false;

    const child = spawn(getPythonCommand(), [scriptPath, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const finalize = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      callback();
    };

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, GENERATION_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      finalize(() => rejectPromise(new Error(`GENERATION_FAILED: ${error.message}`)));
    });

    child.on('close', (code) => {
      clearTimeout(timer);

      if (timedOut) {
        finalize(() => rejectPromise(new Error('GENERATION_TIMEOUT')));
        return;
      }

      const stdoutErrorMatch = stdout.match(/ERROR:(.+)/);
      if (stdoutErrorMatch) {
        finalize(() => rejectPromise(new Error(stdoutErrorMatch[1].trim())));
        return;
      }

      const doneMatch = stdout.match(/DONE:(.+)/);
      if (code === 0 && doneMatch) {
        finalize(() => resolvePromise(doneMatch[1].trim()));
        return;
      }

      const message = (stderr || stdout || 'Unknown generator failure').trim();
      finalize(() => rejectPromise(new Error(`GENERATION_FAILED: ${message}`)));
    });
  });
}

export async function generateModel(input: GenerationInput): Promise<GenerationResult> {
  const tempDir = getTempDir();
  const sourceImagePath = resolve(tempDir, `${input.productId}_source.jpg`);
  const outputPath = resolve(tempDir, `${input.productId}.glb`);

  try {
    await mkdir(tempDir, { recursive: true });
    await downloadImage(input.imageUrl, sourceImagePath);

    const scriptPath = getScriptPath(input.strategy);
    const args = buildArgs(input, sourceImagePath, outputPath);
    const glbPath = await runPython(scriptPath, args);

    await safeDelete(sourceImagePath);

    return {
      glbPath,
      strategy: input.strategy,
    };
  } catch (error) {
    await Promise.allSettled([safeDelete(sourceImagePath), safeDelete(outputPath)]);
    throw error;
  }
}

export type { GenerationInput, GenerationResult };
