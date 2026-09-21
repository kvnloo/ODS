# Extension expansion readiness

Updated 2026-09-21. The complete block is **not yet ready for merge**.

| Requirement | Current evidence | Status |
|---|---|---|
| 200 distinct catalog entries | Source catalog and authenticated local API both contain 200 entries and 200 unique IDs | Complete |
| Real configuration paths | 169 deployable library recipes pass the existing staged-install boundary; 31 built-in entries use their activation/native/base-compose paths | Configuration implemented |
| Preserve the cloud mascot | Current dashboard build retains the cloud assets and is served locally | Preserved |
| Do not install the catalog during development | Validation used temporary files and mocked host calls; existing application container set is unchanged | Honored |
| Catalog chat installation | Exact mentions enter the durable prerequisite coordinator; required settings use the write-only form | Implemented and covered by isolated tests |
| GitHub chat installation | Current request binds repository and recipe digest; preparation and coordinator progression are connected and locally deployed | Supported recipe path implemented |
| GitHub source projects | Commit-bound builds support upstream Dockerfiles or project-specific proposed inline Dockerfiles, with distinct provenance receipts, through preparation and staged reactivation; host pull/build separation is implemented | Implemented in source; deployment pending, custom host hooks/build secrets unsupported |
| Integrate applications with project code | A current successful installation queues one real model continuation for the identified project; a saved pending record offers explicit recovery after reload with a fresh readiness read and stable request identity | Implemented and covered by isolated tests; actual model execution remains unverified |
| Windows, Linux and macOS behavior | Capability-aware recipes and native/WSL paths exist; focused POSIX tests run under WSL | All platform/hardware combinations have not been exercised |
| Credential changes on the local Windows/WSL setup | Service-configured projection refreshes only the API key before API-bound operations; 75 manager tests passed and a live read-only inspection succeeded | Implemented and locally deployed |
| Merge packaging | Combined draft [PR #6156](https://github.com/Osmantic/ODS/pull/6156) targets the existing public-beta baseline | CI and final integration review pending; assess splitting runtime/catalog before merge |

The latest combined isolated API run passed 338 tests covering library staging,
source recipes, GitHub evidence, request binding and recipe publication.
Additional focused runs passed 36 host installation tests, four proposal-tool
tests and 26 Portal installation/progress tests. Project association requires
a successful current installation command; opening saved history does not
submit project-association mutations.

These checks establish only the behavior they exercise; they do not prove that
every upstream application runs on every GPU or operating system. Actual fleet
and application execution remain deferred at the user's request.

No extension application images were pulled or started to establish these
results. Runtime HTTP checks confirmed the Portal, catalog, request route and
an actual recipe guidance response without conversing with the model.
