const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveAndroidApkBuild } = require("./resolve-android-apk.cjs");

const commit = "1234567890abcdef1234567890abcdef12345678";
const build = {
  id: "android-build-id",
  platform: "ANDROID",
  status: "FINISHED",
  gitCommitHash: commit,
  artifacts: { buildUrl: "https://example.com/release.apk" },
};

test("selects the finished APK from the exact release commit", () => {
  assert.deepEqual(resolveAndroidApkBuild([build], commit), {
    id: build.id,
    url: build.artifacts.buildUrl,
  });
});

test("rejects missing or ambiguous build results", () => {
  for (const builds of [null, build, [], [build, build]]) {
    assert.throws(() => resolveAndroidApkBuild(builds, commit), /exactly one/);
  }
});

test("rejects unfinished builds and results from another platform", () => {
  for (const status of ["IN_QUEUE", "IN_PROGRESS", "ERRORED", "CANCELED"]) {
    assert.throws(
      () => resolveAndroidApkBuild([{ ...build, status }], commit),
      /did not finish/,
    );
  }
  assert.throws(
    () => resolveAndroidApkBuild([{ ...build, platform: "IOS" }], commit),
    /did not finish/,
  );
});

test("rejects builds from a different or unspecified commit", () => {
  for (const gitCommitHash of [undefined, "different-commit"]) {
    assert.throws(
      () => resolveAndroidApkBuild([{ ...build, gitCommitHash }], commit),
      /release commit/,
    );
  }
});

test("requires an identified build and an HTTPS artifact", () => {
  assert.throws(() => resolveAndroidApkBuild([{ ...build, id: null }], commit), /ID/);
  assert.throws(
    () => resolveAndroidApkBuild([{ ...build, artifacts: {} }], commit),
    /APK URL/,
  );
  assert.throws(
    () =>
      resolveAndroidApkBuild(
        [{ ...build, artifacts: { buildUrl: "http://example.com/release.apk" } }],
        commit,
      ),
    /HTTPS/,
  );
});
