import { computed } from "vue";
import getURL from "requrl";
import { joinURL } from "ufo";
import { useRuntimeConfig, useRequestEvent } from "#app";
import { SessionLastRefreshedAt, SessionStatus } from "../types";
import { useState } from "#imports";

export const makeCommonAuthState = <SessionData>() => {
  const data = useState<SessionData | undefined | null>(
    "auth:data",
    () => undefined
  );

  const hasInitialSession = computed(() => !!data.value);

  // If session exists, initialize as already synced
  const lastRefreshedAt = useState<SessionLastRefreshedAt>(
    "auth:lastRefreshedAt",
    () => {
      if (hasInitialSession.value) {
        return new Date();
      }

      return undefined;
    }
  );

  // If session exists, initialize as not loading
  const loading = useState<boolean>("auth:loading", () => false);
  const status = computed<SessionStatus>(() => {
    if (loading.value) {
      return "loading";
    } else if (data.value) {
      return "authenticated";
    } else {
      return "unauthenticated";
    }
  });

  // Determine base url of app
  // TL Edit: Get origin from runtime config
  let baseURL;
  if (process.client) {
    baseURL = useRuntimeConfig().public.clientApiBaseUrl;
  } else {
    baseURL = useRuntimeConfig().serverApiBaseUrl;
  }

  return {
    data,
    loading,
    lastRefreshedAt,
    status,
    _internal: {
      baseURL,
    },
  };
};
