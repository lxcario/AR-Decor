import { useEffect, useRef, useState } from 'react';

export type JobStatus =
  | 'queued'
  | 'downloading'
  | 'generating'
  | 'uploading'
  | 'done'
  | 'failed';

interface GenerateResponse {
  jobId: string;
  status: JobStatus;
  modelUrl: string | null;
}

interface StatusResponse {
  jobId: string;
  status: JobStatus;
  modelUrl: string | null;
  error: string | null;
}

interface UseProductModelReturn {
  modelUrl: string | null;
  isGenerating: boolean;
  generationStatus: JobStatus | null;
  error: string | null;
  requestGeneration: () => void;
}

const API_BASE_URL = (import.meta.env.VITE_PIPELINE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 60;

export function useProductModel(
  productId: string,
  existingModelUrl: string | null,
): UseProductModelReturn {
  const [modelUrl, setModelUrl] = useState<string | null>(existingModelUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const activeJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!existingModelUrl) {
      return;
    }

    setModelUrl(existingModelUrl);
    setIsGenerating(false);
    setGenerationStatus('done');
    setError(null);
  }, [existingModelUrl]);

  const clearPolling = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const requestGeneration = () => {
    if (isGenerating) {
      return;
    }

    setError(null);
    setModelUrl((currentUrl) => currentUrl ?? null);
    setIsGenerating(true);
    setGenerationStatus('queued');

    void (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/models/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        });

        if (!response.ok) {
          throw new Error('Failed to start model generation');
        }

        const payload = (await response.json()) as GenerateResponse;

        if (!isMountedRef.current) {
          return;
        }

        setGenerationStatus(payload.status);

        if (payload.status === 'done' && payload.modelUrl) {
          setModelUrl(payload.modelUrl);
          setIsGenerating(false);
          clearPolling();
          return;
        }

        activeJobIdRef.current = payload.jobId;
        let pollCount = 0;

        clearPolling();
        intervalRef.current = window.setInterval(() => {
          pollCount += 1;

          if (pollCount > MAX_POLLS) {
            clearPolling();
            activeJobIdRef.current = null;

            if (!isMountedRef.current) {
              return;
            }

            setError('Generation timed out');
            setIsGenerating(false);
            return;
          }

          const jobId = activeJobIdRef.current;
          if (!jobId) {
            clearPolling();
            return;
          }

          void (async () => {
            try {
              const statusResponse = await fetch(`${API_BASE_URL}/api/models/status/${jobId}`);

              if (!statusResponse.ok) {
                throw new Error('Failed to fetch generation status');
              }

              const statusPayload = (await statusResponse.json()) as StatusResponse;

              if (!isMountedRef.current) {
                return;
              }

              setGenerationStatus(statusPayload.status);

              if (statusPayload.status === 'done') {
                clearPolling();
                activeJobIdRef.current = null;
                setModelUrl(statusPayload.modelUrl);
                setIsGenerating(false);
                return;
              }

              if (statusPayload.status === 'failed') {
                clearPolling();
                activeJobIdRef.current = null;
                setError(statusPayload.error ?? 'Model generation failed');
                setIsGenerating(false);
              }
            } catch (pollError) {
              clearPolling();
              activeJobIdRef.current = null;

              if (!isMountedRef.current) {
                return;
              }

              const message = pollError instanceof Error ? pollError.message : 'Failed to fetch generation status';
              setError(message);
              setIsGenerating(false);
            }
          })();
        }, POLL_INTERVAL_MS);
      } catch (generationError) {
        clearPolling();
        activeJobIdRef.current = null;

        if (!isMountedRef.current) {
          return;
        }

        const message = generationError instanceof Error ? generationError.message : 'Failed to start model generation';
        setError(message);
        setIsGenerating(false);
      }
    })();
  };

  return {
    modelUrl,
    isGenerating,
    generationStatus,
    error,
    requestGeneration,
  };
}
