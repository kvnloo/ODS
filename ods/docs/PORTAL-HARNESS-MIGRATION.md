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

### Local 4B UI recovery test (2026-09-21)

The in-app browser sent `/extensions https://github.com/NandhaKishorM/laya pode ja começar instalar.` with Qwen 3.5 4B selected at 32768 context. Session `4720dc80-5873-4ea2-8270-72ff3ac8465b` failed before accepting a proposal: the model supplied a tool name as serviceId, a numeric Python version (3.10 parsed as 3.1), and then invented tool IDs. The runtime GitHub guard also returned obsolete instructions to finish after proposing, although managed preparation and advancement are now separate tools.

Source recipe validation now names invalid fields without echoing their values or coercing ambiguous versions. A regression test reproduces the invalid library call, proves no proposal submission, then verifies the corrected call retains Python 3.10. The GitHub guard feedback now identifies unavailable tools and references tool discovery plus the actual request operations, without claiming a draft triggers installation. This does not yet remove the restrictive GitHub tool allowlist or establish autonomous installation reliability. Proposal/source tests: 21 passed. Applied these modules and the feedback change locally while gateway reported active=0, then resumed the same UI chat with the 4B. Installation remains unproven until an actual host result and runtime verification are observed.

The same-chat continuation also terminated without installation: the 4B repeatedly called tool_describe on a nonexistent suffixed tool ID, despite a successful tool_search returning valid names. This is distinct from a host installation failure: there was no accepted proposal or host dispatch in this run. Onboarding/runtime-budget tests passed (23). Inspection of the installed OpenClaw runtime found a supported toolSearch `directory` mode with schema hydration and exact hidden-tool resolution, unlike the current `tools` mode's tool_call wrapper. This is a candidate for the next controlled experiment, not yet enabled or validated; do not count it as a completed harness migration.

### Native tool directory experiment (2026-09-21)

OpenClaw's supported `directory` mode hydrates relevant native schemas and resolves exact native tool names. Changed only toolSearch.mode locally, preserving the selected 4B and 32768 context. A fresh identical Laya UI request (chat f27300d5-b4cd-407d-9872-235b80d0ab59; request 56b3bc4c-eedc-43a1-8252-d1e30f79f530) directly called pixel_ods_python_library_proposal. It corrected an initially overquoted Python version on the same tool and obtained accepted draft 7b28fc6b8a533743c8855e9c47b0519084e423b1d9bf49c474cdd3ba05d97701, extension laya-decision-engine. The UI coordinator started real host operation 8f6b61f5731deb64db9d89970090d820; docker buildx bake PID 3820 was observed live. This is in-progress evidence, not installation success. The model's final request for permission and internal IDs remain undesirable and do not describe the concurrent coordinator accurately.

Installers now select directory mode, and GitHub guidance no longer prescribes tool_call wrappers or a fixed discovery sequence. Full JavaScript contracts on WSL: 1347 tests, 1337 passed, 10 skipped, zero failures. A Windows attempt was stopped because POSIX socket tests cannot bind their Unix socket paths there; it is not Windows runtime validation. PR 6156 at 694946ca remains open; its runtime CI failure was an obsolete assertion forbidding preparation. Updated that assertion to cover pending-operation observation and draft-versus-installation semantics. Integration-smoke also has four failures in plugin/installer contracts still to investigate. These local changes have not yet been pushed.

Installer regression follow-up: updated stale simulated plugin lists and exact onboarding/manifest expectations to include the new request tools. WSL installer contract suite now passes 296/296; request/coordinator/manager Python tests pass 105 plus 78 subtests. The Laya build is still the original operation. Read-only Buildx history logs show pinned source installed as laya 0.3.5 and pip check passed, then image layer export. Pip selected CUDA dependencies from the default Torch distribution on this AMD host. No GPU functionality or inference verification is established; dependency/backend selection still needs a researched capability-aware recipe. Do not treat import-only verification as proof of Laya inference or call this broad migration complete.

Laya operation 8f6b61f5731deb64db9d89970090d820 subsequently completed at 2026-09-21T19:49:32Z. Host receipt state=succeeded and exit_verified=true; Docker ods-laya-decision-engine exited 0. This proves pinned package build, dependency checks, and configured imports (laya, laya.router), not checkpoint inference or GPU acceleration. No duplicate host installation was started. Changes through 359fbe8e were pushed to PR 6156; new remote CI results are pending verification.

### Isolated preparation boundary (2026-09-21)

Removed the GitHub-specific blanket workspace-tool deny list. Preparation now uses ordinary sandbox file/exec/process policies when the configured execution host is sandbox. When it is gateway or unknown, mutating preparation tools remain blocked with an explicit isolation error; managed recipe and research tools remain available. The plugin passes the actual configured execution host at prompt setup, and subsequent tool observations retain it. Direct and deferred calls are covered. This is not a claim that the local sandbox is enabled: local configuration currently sets the Pixel agent sandbox mode off, so enabling/requalifying an actual isolated preparation environment remains outstanding. This change is not deployed locally yet. Full WSL JavaScript suite: 1348 tests, 1338 passed, 10 skipped. Metadata enrichment for imported extension cards is also desirable: the Laya card currently lacks a description, and import verification must not be described as inference validation.

### Agent-owned installation and observed continuation (2026-09-21)

GitHub UI observation no longer calls prepare or install-next after receiving a proposal. Only agent-managed tools initiate those steps. Read-only polling validates the same request/proposal and reports current runtime status. Navigation/unmount now detaches observation without cancelling the durable request; explicit stop retains cancellation. Follow-up inference context shares the API's owner-bound observation and includes current installationState rather than a permanent not-observed placeholder. Tested three ordinary follow-up wordings against an active installation without interpreting them as authorization keywords.

Frontend observer/progress tests: 23 passed; API request/status tests: 27 passed; production dashboard build passed. Deployed the observer UI and shared read-only API/context locally. A subsequent real 4B status question still failed: it repeatedly called pixel_ods_research (Perplexica unavailable), rather than reading the local request state. An independent authenticated request read confirmed pending request, accepted/prepared recipe, runtimeStatus=cli_installed. This is a model/tool-discovery failure, not a failed installation; it remains unresolved.

Added optional researched description to source/Python proposal schemas, preserved in manifest catalog metadata. Older eight-field library proposals remain accepted; invalid descriptions do not submit proposals. Proposal/source tests: 22 passed. This metadata capability is in code, not backfilled into the installed Laya receipt. Remaining work includes dependable native tool selection, actual sandbox provisioning and preparation, read-only receipt visibility during long operations, dependency/GPU selection, and specific functional verification beyond imports.

### Follow-up routing and discovery accounting (2026-09-21)

The runtime systemPromptReport for the failed Laya status turn exposed cron, music_generate, subagents and pixel_ods_research plus search/describe/call controls. The native request-status schema was deferred. This is concrete evidence that directory hydration selected unrelated capabilities; it does not establish that the model lacked the routing context. Repeating a natural local-status question with the same 4B/32768 after updating the local prompt contract still failed through research calls. No reinstall was requested or performed by this test.

Bound-recipe continuations now obtain fresh local state without an automatic repository/layout network inspection. Source remains available for explicit investigation; this reduces irrelevant evidence and network dependencies on conversational follow-ups. Request/status tests: 27 passed. Fixed a separate run budget flaw: successful schema discovery no longer resets consecutive action failures or progress rounds. Distinct search queries cannot sustain a discovery-only loop. Progress tests: 11 passed. Applied these changes locally with the gateway confirmed idle before restart.

PR checks for 08226530 passed, including integration-smoke and platform frontend checks (three security jobs skipped). These checks do not prove model autonomy, native macOS installation, sandbox preparation or project-specific inference. Native capability selection and the full agent-owned installation acceptance test remain unfinished.

### Native-tool comparison and unknown inspection states (2026-09-21)

Compared the same 4B/32768 with tool-search temporarily disabled, preserving other configuration. The existing Laya conversation compacted, then still repeated research calls; the new run-wide failure budget stopped it. Its systemPromptReport contained 57 native tools / 39,621 schema characters, including request status. Therefore incorrect directory hydration is not the sole failure; full exposure is not a proven replacement. Restored the original search settings after confirming idle.

A fresh native-tools conversation selected the read capability but invented serviceId laya-extension. The manager's failure envelope incorrectly used not_installed for all errors, including an unknown ID/API failure. The model consequently claimed Laya was absent despite the existing laya-decision-engine installation. Replaced these fabricated states with unknown, accepted only for failed lifecycle receipts; failed inspections no longer receive the 'Pixel verified' prefix. This correction concerns state evidence, not a canned model answer or name-specific recipe.

Validation: 78 manager tests passed on WSL; all 539 tool-loop guard tests passed on WSL. Windows focused native-read tests passed (7); the full Windows suite hit its existing POSIX ownership/control-root test and is not claimed as native Windows qualification. Updated the local manager and only the corresponding runtime guard sections while idle. A direct local failure receipt now reports unknown. No extension was installed, removed or restarted by these read-only comparisons. Autonomous end-to-end installation, selective native capabilities, sandbox provisioning and project-specific verification remain open.

### Readback failure signaling and remaining identity burden (2026-09-21)

The native extension read tool now marks an inner failed or unverified inspection as isError while preserving the original broker job and steps. A successful broker delivery is not a successful extension lookup. Pending and cancelled observation retain their existing job-readback instructions; they are not converted into terminal failures. The error provides catalog discovery as an available recovery capability, without starting an install or choosing a replacement ID. All 19 host-read/cancellation tests pass.

Deployed host-observe.mjs locally and repeated the read-only 4B/32768 native-tool comparison in a fresh chat. Session 47cf6ab6-aab3-4fe0-87df-21ae709decd6 still failed: it invented requestId laya-extension-check, retried it, supplied an oversized catalog query, combined search and inspect parameters, then inspected the invented laya-extension ID. Its prose still incorrectly asserted absence despite reporting unknown. No install occurred. Restored original tool-search configuration while idle after the test.

This motivates moving request identity entirely into the owner/session-bound tool adapter rather than requiring the model to reproduce routing identifiers, and simplifying action-specific schemas. That change is not implemented by this commit. The current result does not qualify autonomous recovery or overall completion.

### Session-owned request identity (2026-09-21)

Status, preparation and advancement now expose empty parameter objects. Their adapter resolves the active GitHub request from the trusted session hash through the manager and authenticated API; the model no longer needs to supply chatId/requestId for these three capabilities. The API filters by authenticated owner, validates stored records, rejects ambiguity, and excludes cancelled/expired scopes. Every downstream operation still revalidates the original request and immutable recipe. Validated legacy explicit-ID calls remain accepted for migration; foreign chat IDs remain rejected. Proposal creation still requires routing fields and is the next migration boundary.

Added a closed manager resolve action and fixed API endpoint, including request-body validation and credential refresh. An initial local probe exposed a missing path allowance in the HTTP transport; fixed it and added a test across that boundary rather than mocking the entire request helper. Missing scope prevents dispatch and explicitly does not imply absence of an installed extension.

Tests: 29 API request/status, 80 manager tests on WSL, 46 proposal/prompt JavaScript tests passed. Deployed API resolver, manager and plugin locally. Directly executing the production status tool with empty arguments in the original Laya session returned its original requestId, extensionId=laya-decision-engine and runtimeStatus=cli_installed. This is real read-only transport/binding evidence, not proof of model selection or new installation. No model/context setting was changed in this step. Full model-driven recovery and installation acceptance remain open.

### Proposal schemas now use session binding (2026-09-21)

Both proposal adapters now resolve routing from the trusted session. The Python-library schema exposes six recipe fields plus optional description; the general schema accepts source or candidate without chatId/requestId. Existing validated explicit-ID calls remain compatible but are no longer advertised. Missing or foreign session scopes cannot submit a draft; the original repository and all existing recipe validation remain intact. Removed obsolete prompt guidance requiring the model to copy IDs and referring to UI-driven preparation.

Validation: 48 proposal/prompt JavaScript tests and 29 API request/status tests passed. Deployed proposal and API routing guidance locally. A fresh real 4B/32768 test requested research and a proposal for pallets/click, explicitly no installation. It recovered from unavailable research to web extraction of upstream docs and PyPI. The run then compacted automatically and reports active, with no proposal yet. Session 58637ccd-1685-4f6b-8341-20d27e485562; run chatcmpl_d9bc84ab-328d-45cd-8de7-1bc770c62e41. Gateway log reports compaction complete at 17:52:47 -03, willRetry=true, but no subsequent model fetch was observed at the last poll. Do not infer terminal state or restart/reissue from this observation gap. Investigate compaction continuation and poll the same run.

Tool search is temporarily disabled for this native-schema comparison; restore tools.toolSearch from /home/gabs/.openclaw/openclaw.harness-native-tools-backup.json only after the run is authoritatively terminal/idle. Model and context are unchanged. The latest prompt-contract wording edit is in the repository but not yet copied/restarted locally, to preserve this active run. End-to-end acceptance remains unproven.
