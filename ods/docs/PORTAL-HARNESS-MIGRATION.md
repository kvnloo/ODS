# Portal harness migration

Status: in progress. This document is a migration plan, not installation evidence.

## Observed starting point

PR #6156, baseline `7fcfc531`, contains the existing catalog, source recipe
compiler, scoped proposal channel and host installation coordinator. Preserve
these components, the cloud mascot and current UI during migration.

The local session `516e05c4-558a-4efe-89f0-614317ee0264` demonstrates distinct
failures: the model selected an unavailable installation tool, a follow-up used
ordinary sandbox execution instead of the managed extension flow, and system
Python rejected pip with `externally-managed-environment`. These are model,
integration and environment failures respectively. None establishes a successful
ODS installation. A virtual environment alone would address only the last one.

## Ownership

The model chooses investigative steps, writes integration files, interprets
build errors and revises its implementation. ODS owns execution boundaries,
operation identities, process handles, cancellation, persistence and promotion
into managed Extensions. Neither assistant prose nor a saved recipe is a runtime
receipt. An uncertain operation must be observed before another is dispatched.

Catalog requests reuse existing installation recipes. GitHub requests use an
isolated preparation workspace followed by managed promotion. Preparation may
clone, read, edit, build and test within the granted environment. It must not
silently become an unmanaged installation on the host.

## Migration stages and acceptance evidence

1. **Durable continuation.** Project the authenticated request, bound proposal
   and immutable revision into subsequent turns. Keep user intent distinct from
   persisted facts. A missing draft is an explicit recovery condition, never a
   reason to install another copy. Query actual installation state separately
   from proposal acceptance. Verify owner isolation, cancellation, expiry,
   changed upstream HEAD, missing records and retries after publication.
2. **Preparation workspace.** Bind each preparation workspace to its request and
   expose ordinary file/process tools there. Detect the actual execution host,
   sandbox capability, architecture, available resources and network policy.
   Replace the current blanket GitHub tool prohibition only when this boundary
   is implemented. Preserve normal tools for unrelated user work.
3. **Managed promotion and repair.** Give the agent direct, scoped operations to
   inspect, submit, prepare, advance and observe installations. Infer routing
   identifiers from verified session state where possible. Keep external
   operation identities stable across retries; require a terminal observation
   before replacing a failed recipe. Preserve previous recipe revisions and
   existing data. UI closure must not lose the operation or its result.
4. **Context and skills.** Load relevant ODS integration guidance on demand.
   Keep schemas small and direct. Remove contradictory prompts and obsolete
   phrase-based routing as structured state replaces them. Compaction retains
   operation IDs, current revision, outstanding processes and owner constraints.
5. **Real end-to-end verification.** Exercise both catalog and previously
   uncatalogued repositories, including a library, a web application and a
   project with build dependencies. Include configuration-required, failed
   build/repair, cancellation, reconnect and repeated-request cases. Demonstrate
   actual runtime functionality; importing a Python module proves only import
   readiness, not its inference or application behavior.

## Platform and model contract

Do not change the selected model, context size or GPU backend implicitly.
Support small models through usable tools and informative results, not canned
answers or a promise of identical capability. Existing Linux/WSL and macOS
manager transports must remain supported. Windows-native execution needs its
own supported adapter; a POSIX path is not a Windows implementation. Docker
availability and image architecture are observed prerequisites, not assumptions.

Record actual tested combinations separately. Cross-platform unit tests and CI
are useful but do not prove a local installation on every OS/GPU combination.

## Current evidence

- Repeated accepted proposals recover their immutable receipt without another
  validation/install dispatch; regression tests cover corrupted saved drafts.
- Follow-ups now receive their bound proposal and inspect its accepted commit
  instead of resolving a newer HEAD. Tests cover another owner's conversation
  and a missing/corrupted draft.
- The autonomous preparation workspace, direct managed lifecycle tools, skill
  migration and full real-installation acceptance matrix remain outstanding.
- The existing local 4B failure has not been turned into a verified installation.
- Added `pixel_ods_extension_request_status`: a session-bound read of the saved
  request, verified prepared package and catalog runtime observation through
  the existing Unix manager channel. It performs no lifecycle mutations and
  exposes no credentials or raw application configuration. Unavailable runtime
  observations remain `not_observed`; proposals never imply readiness. API,
  plugin and WSL manager regression checks pass. Local deployment and a direct
  native-tool → Unix manager → HTTP API read succeeded: the previous test
  request correctly reported `expired` and `not_observed`, with no installation
  side effects. This found and fixed a missing internal HTTP route allowance;
  the regression now exercises actual HTTP transport. Real model selection and
  use of the tool remain to be verified.
- After the local environment restarted, WSL services restarted between client
  invocations. A supervised WSL lifetime client keeps this development session
  available. Permanent lifecycle integration for this hybrid Windows/Docker
  Desktop plus WSL-native Portal setup remains outstanding; this temporary
  process does not prove restart persistence.
- Added `pixel_ods_extension_request_prepare`, bound to the same original
  conversation/request. It uses the existing cancellation-aware, immutable
  preparation endpoint and returns a request-bound package receipt. It cannot
  select another draft, install dependencies or start containers. Removed the
  instruction that forced the agent to end immediately after saving a proposal.
  Preparation and observation are now available without a second broker job;
  host execution still uses its existing lifecycle boundary. Regression checks
  cover API cancellation, identity validation and real manager HTTP transport.
  Local deployment and a native-tool → manager → API probe against the real
  `pallets/itsdangerous` repository succeeded at commit
  `672971d66a2ef9f85151e53283113f33d642dabd`. The bound package was prepared;
  status correctly remained `not_installed`. This was a direct tool probe,
  not proof of autonomous model tool selection.

- Real host installation testing exposed a Windows Docker Compose 5.0.2 /
  Buildx 0.31.1 failure: Compose passed the remote Git context as an `fs.read`
  entitlement; Buildx tried to resolve `https:` as a Windows filesystem path.
  Remote Windows builds now compile the selected Compose targets with
  `build --print` and pass the unchanged plan to Buildx, without synthetic
  filesystem grants. Local builds and non-Windows hosts retain their path.
  Failed builds are not automatically replayed. Eleven focused regression
  cases passed. The corrected helper built the real pinned image successfully.
  An isolated, network-disabled container signed and decoded a payload and
  rejected a tampered token using ItsDangerous. The original managed install
  still has a failed-build receipt; this image check is not an installed ODS
  extension. Failed-operation reconciliation and model-driven verification
  remain outstanding. The host-agent patch is also in the local installation
  and retained deployment source; macOS/Linux execution was not tested here.

- Host installation attempts now have persistent operation identities. The
  authenticated install endpoint accepts an idempotency ID (or generates one
  for legacy callers), saves it before execution, and returns the same attempt
  on replay. A separate authenticated observation endpoint reads that exact
  service/operation pair. Progress carries the operation ID. Orphaned workers
  and Docker timeouts remain uncertain and block new host attempts; they are
  not inferred to have failed. A disconnected HTTP observer no longer prevents
  the accepted worker from starting or releases its lock twice. Host regression
  coverage includes replay, conflicting input, restart uncertainty, timeout,
  disconnected observer and actual authenticated HTTP observation. The host
  suite passed 367 tests (4 skipped) before the final progress-identity addition;
  six focused checks then passed. The dashboard coordinator and model tools
  still need to persist/query these IDs and expose an explicit reconciled
  retry. This change alone does not complete managed repair or the Laya case.

- The dashboard installation coordinator now persists the host operation ID
  before dispatch, forwards it through the existing installer and queries the
  authenticated host receipt on subsequent advances. Acceptance must match
  both service and attempt. A missing/mismatched receipt remains unresolved;
  a confirmed failed attempt is reported as failed without redispatch. A
  previously healthy container cannot erase a newly running attempt: successful
  host completion and a ready runtime observation are both required. Legacy
  journal records remain conservative and are not assigned invented IDs.
  The UI handles confirmed failure as terminal. Twenty-six focused API tests
  and twenty UI tests passed. The broader extensions suite is still running.
  This coordinator/host protocol has not yet been deployed together locally.
  Explicit reconciled retry and model-facing lifecycle tools remain pending.

## Local 4B probes, 2026-09-21

- The broader coordinator/extensions suite completed: 295 passed. The host
  attempt protocol and coordinator were deployed together locally. After
  inspecting the previous terminal build failure and confirming no container
  existed, an explicit retry through the normal install endpoint completed for
  ItsDangerous. Operation `8239608228b0cbbd7fe0c8ee50c5bf89` is `succeeded`,
  `exit_verified=true`; the container exited zero and the catalog reports
  `cli_installed`. This was an operator-driven integration check, not an
  autonomous model installation. The public install endpoint still uses legacy
  premature "installed" wording when only startup is accepted; that remains to
  be corrected without breaking existing callers.
- Restored the selected 4B with Vulkan and context 32768. Its native Lemonade
  process was absent. The old scheduled task specifies 65536 and was not used.
  The edge container also had an empty ingress mount after WSL restart. A
  local shared WSL bind and retained Compose override restored the socket.
  This is development recovery, not a persistent cross-platform lifecycle fix.
- Actual Portal chat probe `harness-4b-1087202ad8d1` against `pallets/click`
  exposed missing tool allowances: plugin registration existed, but installer
  generated lists omitted the Python proposal, request status and preparation
  tools. The model received unknown-tool errors and falsely claimed a saved
  proposal. Installer/onboarding/runtime-budget lists and local allowances are
  now corrected; targeted POSIX tests passed (32 tests, 19 subtests). Native
  Windows execution of these POSIX provisioning scripts is unsupported and
  failed at `os.getuid`; their WSL execution was used for this verification.
- A second real 4B probe, `harness-4b-1a3d7f06aae5`, discovered the tools,
  recovered from a wrong routing identity, saved a bound proposal and read its
  status. The turn nevertheless hit context overflow and ended with a generic
  failure. The proposal also uses class names as Python imports, so it must
  not be promoted as verified. Draft `1b326ae67b4bd889dbffa22ee42183e9ac3d955d633614afcf964c8e5d97394b`
  is accepted, not installed. Next work must address isolated validation/repair,
  context recovery, truthful completion evidence and simpler session-bound
  tool identity instead of treating this partial success as completion.

- The failing 4B run's gateway log confirms two actual overflow compactions
  with retry. Its final error was an incomplete `toolUse` turn after side
  effects, not absence of compaction. Do not remove replay protection to hide
  that distinction. Repeated tool-call envelopes also copied discovery
  descriptions into every execution result. A new persist projection keeps
  identity and the entire result/error/evidence while removing only repeated
  discovery metadata. On the saved trace this removed 18,871 characters from
  139,114 characters of tool-result content (23 receipts). Original structured
  details remain available to auditing. Fourteen focused Node checks passed.
- Deployed the projection and ran another real 4B/32768 Portal probe,
  `harness-4b-98c315d567bf`. It produced an accepted Click proposal with
  `pythonImports: ["click"]`, then read its saved status and delivered a final
  response. Draft `ecdcfe6f1d2d016ed3d4f6da4c2cc614468eb32da523a799efc6981f1dc326c0`.
  A follow-up "Sim, pode instalar no ODS e verificar se funciona." retained
  request `prepare-1`, prepared that same recipe and observed `not_installed`.
  It then stopped. This proves proposal/preparation continuity in this probe,
  not successful installation or a general context-overflow fix. A direct
  session-bound managed advance tool is still missing and is the next concrete
  integration gap. The 4B inference model/context were unchanged.
