import { computed, watch, ComputedRef } from "vue";
import type { CookieRef } from "#app";
import { CommonUseAuthStateReturn } from "../../types";
import { makeCommonAuthState } from "../commonAuthState";
import { useTypedBackendConfig } from "../../helpers";
import { useRuntimeConfig, useCookie, useState } from "#imports";
// @ts-expect-error - #auth not defined
import type { SessionData } from "#auth";

interface UseAuthStateReturn extends CommonUseAuthStateReturn<SessionData> {
  token: ComputedRef<string | null>;
  rawToken: CookieRef<string | null>;
  setToken: (newToken: string | null) => void;
  clearToken: () => void;
}

export const useAuthState = (): UseAuthStateReturn => {
  const config = useTypedBackendConfig(useRuntimeConfig(), "local");
  const commonAuthState = makeCommonAuthState<SessionData>();

  const tokenNCookieName = `${config.token.cookiePrefix}_token.local`;
  const strategyCookieName = `${config.token.cookiePrefix}strategy`;
  const expiresAtCookieName = `${config.token.cookiePrefix}_token_expiration.local`;
  
  // Re-construct state from cookie, also setup a cross-component sync via a useState hack, see https://github.com/nuxt/nuxt/issues/13020#issuecomment-1397282717
  const _rawTokenCookie = useCookie<string | null>(tokenNCookieName, {
    default: () => null,
    maxAge: config.token.maxAgeInSeconds,
    sameSite: config.token.sameSiteAttribute,
    secure: config.token.secureAttribute,
    domain:
      config.token.domainAttribute === "default"
        ? undefined
        : config.token.domainAttribute,
  });

  useCookie<string | null>(strategyCookieName, {
    default: () => "local",
    sameSite: config.token.sameSiteAttribute,
    secure: config.token.secureAttribute,
    domain:
      config.token.domainAttribute === "default"
        ? undefined
        : config.token.domainAttribute,
  });

  const _expiresAtCookie = useCookie<number | null>(expiresAtCookieName, {
    default: () => null,
    sameSite: config.token.sameSiteAttribute,
    secure: config.token.secureAttribute,
    domain:
      config.token.domainAttribute === "default"
        ? undefined
        : config.token.domainAttribute,
  });

  const rawToken = useState("auth:raw-token", () => _rawTokenCookie.value);
  watch(rawToken, () => {
    _rawTokenCookie.value = rawToken.value;
    if(!_expiresAtCookie.value) {
      // Set expiration time cookie for nuxt.js to know when to refresh the token
      // No usage in this lib, only for nuxt.js auth package
      _expiresAtCookie.value = Date.now() + (config.token.maxAgeInSeconds * 1000);
    }
  });

  const token = computed(() => {
    if (rawToken.value === null) {
      return null;
    }
    return config.token.type.length > 0
      ? `${config.token.type} ${rawToken.value}`
      : rawToken.value;
  });

  const setToken = (newToken: string | null) => {
    rawToken.value = newToken;
  };

  const clearToken = () => {
    setToken(null);
  };

  const schemeSpecificState = {
    token,
    rawToken,
  };

  return {
    ...commonAuthState,
    ...schemeSpecificState,
    setToken,
    clearToken,
  };
};
export default useAuthState;
