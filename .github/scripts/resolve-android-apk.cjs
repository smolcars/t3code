const { readFileSync } = require("node:fs");

function resolveAndroidApkBuild(builds, expectedCommit) {
  if (!Array.isArray(builds) || builds.length !== 1) {
    throw new Error("Expected exactly one EAS Android build.");
  }

  const build = builds[0];
  if (build?.platform !== "ANDROID" || build.status !== "FINISHED") {
    throw new Error("EAS Android build did not finish successfully.");
  }
  if (build.gitCommitHash !== expectedCommit) {
    throw new Error("EAS Android build does not match the release commit.");
  }
  if (typeof build.id !== "string" || !build.id) {
    throw new Error("EAS Android build is missing its ID.");
  }
  if (typeof build.artifacts?.buildUrl !== "string") {
    throw new Error("EAS Android build is missing its APK URL.");
  }
  const url = new URL(build.artifacts.buildUrl);
  if (url.protocol !== "https:") {
    throw new Error("EAS APK URL must use HTTPS.");
  }

  return { id: build.id, url: url.href };
}

module.exports = { resolveAndroidApkBuild };

if (require.main === module) {
  const [buildJsonPath, expectedCommit] = process.argv.slice(2);
  if (!buildJsonPath || !expectedCommit) {
    throw new Error("Usage: resolve-android-apk.cjs <build-json> <release-commit>");
  }
  const build = resolveAndroidApkBuild(
    JSON.parse(readFileSync(buildJsonPath, "utf8")),
    expectedCommit,
  );
  process.stdout.write(JSON.stringify(build));
}
