import { useEffect, useState } from "react";
import { fetchActiveSteps } from "../lib/processSteps";
import type { ProcessStep } from "../lib/processSteps";

export function useProcessSteps() {
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchActiveSteps();
        if (isMounted) setSteps(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { steps, loading };
}