import { useCallback, useEffect, useState } from "react";
import type { PlacedObject } from "../types/app";

const STORAGE_KEY = "ar_decor_scene_v1";

interface UseSceneStorageReturn {
  savedObjects: PlacedObject[];
  saveObject: (obj: PlacedObject) => void;
  removeObject: (instanceId: string) => void;
  clearScene: () => void;
}

function readStoredScene(): PlacedObject[] {
  if (typeof window === "undefined") {
    return [];
  }

  let rawValue: string | null = null;

  try {
    rawValue = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? (parsedValue as PlacedObject[]) : [];
  } catch {
    return [];
  }
}

function persistScene(nextObjects: PlacedObject[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextObjects));
  } catch {
    // Fall back to in-memory state when storage is unavailable.
  }
}

function removeStoredScene() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Fall back to in-memory state when storage is unavailable.
  }
}

export function useSceneStorage(): UseSceneStorageReturn {
  const [savedObjects, setSavedObjects] = useState<PlacedObject[]>([]);

  useEffect(() => {
    setSavedObjects(readStoredScene());
  }, []);

  const saveObject = useCallback((object: PlacedObject) => {
    setSavedObjects((currentObjects) => {
      const existingIndex = currentObjects.findIndex(
        (currentObject) => currentObject.instanceId === object.instanceId,
      );

      const nextObjects =
        existingIndex === -1
          ? [...currentObjects, object]
          : currentObjects.map((currentObject, index) =>
              index === existingIndex ? object : currentObject,
            );

      persistScene(nextObjects);
      return nextObjects;
    });
  }, []);

  const removeObject = useCallback((instanceId: string) => {
    setSavedObjects((currentObjects) => {
      const nextObjects = currentObjects.filter(
        (currentObject) => currentObject.instanceId !== instanceId,
      );

      persistScene(nextObjects);
      return nextObjects;
    });
  }, []);

  const clearScene = useCallback(() => {
    setSavedObjects([]);
    removeStoredScene();
  }, []);

  return {
    savedObjects,
    saveObject,
    removeObject,
    clearScene,
  };
}
