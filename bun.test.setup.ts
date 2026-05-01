import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { beforeEach, expect } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";

GlobalRegistrator.register({ url: "http://localhost:3000/" });

expect.extend(matchers as never);

beforeEach(() => {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
  }
});
