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

### Truncated-turn compaction continuation repair (2026-09-21)

Reproduced a concrete integration defect in the installed runtime: the existing ODS repair removed a token-truncated assistant message before compaction, but compaction rebuilt retained messages from the saved transcript and restored that tail. `runAutoCompaction` reported `willRetry=true`; the real Agent continuation then threw `Cannot continue from message role: assistant`. The subscription still awaited the announced retry. This is not evidence of an installation failure or poor model tool selection.

The source-bound repair now removes the unfinished error/length tail after compaction rebuilds history, only in the retry branch. Completed tool results and completed assistant answers remain intact. The original reviewed byte hash is unchanged; the previous deployed repair can migrate through the verified original baseline. Six runtime-bound regression checks pass, covering real Agent continuation validation, preserved tool results, completed answers, skipped compaction and cancellation. Run with `ODS_OPENCLAW_ROOT=<installed npm runtime> node --test ods/extensions/services/pixel-agent/tests/compaction-resume-runtime.mjs`. The separate repair custody suite passed all 23 tests on WSL.

Explicitly cancelled the old research-only test through the UI Stop control. The gateway reported its exact run aborted, and access-runtime reported idle/active=0 before applying the repair and restarting. Also deployed the previously pending prompt-contract wording. No installation was repeated. Retested the same Click research-only prompt with Qwen 3.5 4B/32768: run `chatcmpl_fe083d3e-1ddf-4ca7-8633-64a7ca9f96f6` compacted at 18:11:13-17 -03, then issued a new model fetch at 18:11:17.334. This proves the previously missing continuation starts; final research/proposal outcome and installation remain unverified at this observation. Tool search remains temporarily disabled for this ongoing comparison.

The next response again stopped with length after one output token; input usage grew from 28,137 to 28,523 despite compaction. A second defect reset overflowRecoveryAttempted on length, admitting another retry without completed output. The repair now resets that budget only on non-error, non-length responses. Ten runtime-bound checks pass including this event-handler behavior. The expanded native schema/system context remains too large in this comparison; this repair does not qualify the overall research or installation flow. Cancelled this second test explicitly, confirmed active=0, deployed the final repair, restored the original tool-search configuration and restarted. Model/context were not changed. Session `9f958af4-3542-494a-bf93-1236fa241dee` contains the second test; no proposal/install was completed. Next work must reduce capability/context overhead and validate autonomous preparation, authorization and advancement end-to-end. PR checks for prior HEAD fb91cc98 were green (three review/security jobs skipped), before this repair commit.

### On-demand operating guides and capability exposure comparison (2026-09-21)

Replaced the long universal conversation contract with one 2,829-character core shared across context sizes. Added the read-only `pixel_ods_skill` capability with independently loaded extension, workspace, research and verification guides. The model selects a topic; the tool does not inspect prompt keywords, grant permission, generate a recipe or start an action. Core instructions retain state-aware authorization and evidence rules. Detailed guidance preserves the distinction between sandbox experimentation, prepared recipes, managed operation receipts and project-specific verification. Existing route-specific legacy contracts/guards remain; their removal is still required as replacement capabilities are qualified.

Registered the guide in the plugin manifest, onboarding, runtime-budget and installer allowlists. Loading a guide does not reset consecutive action-failure accounting. Tests now check bounded core semantics and guide isolation/closed arguments rather than requiring the removed universal mandatory tool sequences. Validation: 42 focused JavaScript checks, 539 guard checks on WSL, and 32 onboarding/budget tests plus 19 subtests on WSL passed. Native Windows execution of the POSIX installer tests failed on existing os.getuid/shell assumptions and does not qualify Windows-native installation. Corrected shell line endings before the successful WSL run.

Deployed guides and ran two fresh research-only Click requests with the same Qwen 3.5 4B/32768. Directory mode session `a381d559-c9c3-4248-84db-bf2c47e509a7` still exposed cron/research/proposal/preview plus discovery controls and repeated unavailable research. Native comparison session `38e8ddc7-6499-46e4-a558-4120b06d742d`, run `chatcmpl_e18c2263-cffd-4dff-adc6-49496f76ad5c`, fetched repository evidence successfully but exhausted usable context. The second compaction reported willRetry=false and the run surfaced an incomplete-turn error promptly, confirming the previous stuck retry is bounded. Neither run produced an installed extension or a completed proposal.

Actual systemPromptReport metrics remain large: directory mode 31,244 system-prompt characters / 10,951 schema characters; native mode 21,970 / 39,428. Do not infer an equivalent reduction of the total runtime prompt from the smaller ODS core alone. No actual model guide load was observed in these runs. Selective native capability exposure and remaining prompt sources must be addressed next. Confirmed idle, restored the original tool-search settings, and restarted; model/context and existing installations were preserved. Autonomous end-to-end acceptance remains open.

### Model-selected discovery and existing-repository evidence (2026-09-21)

Confirmed upstream directory hydration scores English prompt keywords and preselects at most four tools. The supported `tools` mode instead exposes search/describe/call and retains permitted capabilities in its catalog without that preselection or the full directory injection. Updated both installer paths to this mode, retaining localModelLean=false and existing permission boundaries. Local 4B/32768 session `1c3a8a9f-d57c-4b30-8fce-fa1a73ce0cc8` measured 16,832 system-prompt characters and 513 native schema characters. It read actual pinned Click source, corrected malformed proposal arguments, then encountered the real existing repository registration. No recipe specific to Click or request-keyword planner was introduced.

The API validator already knew existingExtensionIds but the scoped proposal endpoint and manager discarded them, while the plugin told the model to correct its recipe. This caused a renamed duplicate attempt that could not resolve repository identity. The scoped error now preserves bounded validated IDs through API/manager/plugin and explains that registration is not installation/health, changing serviceId cannot resolve the conflict, and inspection is available. It grants no mutation or automatic retry. A direct production-adapter probe returned existingExtensionIds=[click-python-library], isError=true and installationStarted=false. This is transport evidence, not model-driven recovery acceptance.

The subsequent identical model retest (`385d2939-0f69-45bf-87bb-5818d852bd72`, run `chatcmpl_945dc971-7b57-4f3e-bc97-0f659ff3e134`) instead repeated tool_search queries and was stopped by the no-progress budget before reaching proposal handling. Model-selected discovery has removed unwanted preselection and schema overhead but remains inconsistent with the 4B. Next work should expose a small stable native capability surface while retaining discovery for the rest; do not return to all-schema exposure or infer installation success. No new installation occurred. Local tool-search now intentionally remains in the committed tools mode; model/context are unchanged.

Validation: 21 proposal-tool tests, 80 manager tests with 85 subtests, 24 request API tests, and 32 installer/onboarding tests with 19 subtests passed (POSIX suites on WSL). Current runtime is idle after these terminated tests. Native macOS/Windows runtime qualification, sandbox preparation, agent-owned installation and project-specific functional verification remain open.

### Stable native working tools with deferred specialists (2026-09-21)

Extended the existing source-bound tool-search repair rather than layering competing patches over the same runtime module. Pixel tools-mode now exposes available, uniquely named workspace primitives, web research, operating guides, owner questions, extension lookup and request status directly. All permitted specialist tools remain catalogued; no prompt keyword selects a plan. Missing policy-filtered tools are not synthesized, duplicate names remain deferred, and other agents preserve prior behavior. The same manifest migrates each reviewed predecessor and restores the original upstream bytes.

Validation: 16 tests against the actual candidate module passed (catalog behavior plus existing image/result envelope preservation). All 24 POSIX repair tests passed, including every reviewed predecessor apply/reapply/restore using exact package bytes. Local apply returned changed, second apply unchanged. Restart occurred only after runtime active=0. Model/context remain Qwen 3.5 4B/32768. The new surface has 15 visible tools, 6,819 schema characters and a measured 17,295-character system prompt; this is not equivalent to end-to-end success.

Live browser session bbb639e6-40f8-4ebc-8049-63d01c0f0397 researched Click but encountered a stale locally deployed GitHub allowlist blocking the newly registered skill, then described an unsaved proposal with HEAD instead of a verified commit. Deployed the repository preparation boundary and its execution-host state to the local guard after the run ended. The next session 68c6b558-09d4-48dd-a6ac-f0826c116e8c loaded the research skill successfully, searched and observed pending/proposalAccepted=false/prepared=false, but still returned a pip-oriented textual plan without submitting a proposal. Natural follow-up authorization is being tested; neither run proves managed installation or project functionality.

### Real 4B follow-up and environment/model-switch failures (2026-09-21)

The natural follow-up `Sim, pode instalar no ODS.` in 68c6b558-09d4-48dd-a6ac-f0826c116e8c preserved request identity, but the 4B repeatedly called status with unchanged results and hit the loop budget. No managed installation occurred. The owner explicitly authorized comparing the installed 27B only if model behavior warranted it; the selected 27B retains its displayed 16K context, while 4B retains 32K.

The first browser model switch failed before loading: WSL used an empty native Docker daemon while the ODS Edge container lived in Docker Desktop. Model status alone did not exercise the second admission gate. Enabled the existing default-distro Docker Desktop integration (settings backup retained), restarted Desktop after confirming Portal idle and WSL Docker empty, and disabled the conflicting empty native Docker service/socket. Windows and WSL then returned identical running Edge container IDs. This is a verified local environment repair, not installer qualification across hosts.

The next switch failed while recreating LiteLLM because the global Compose set interpolated an unrelated pending DocuSeal extension's missing required secret. Added core recreation scoping: preserve base/GPU/model overlays and extension fragment groups contributing core services, with transitive service references, while excluding unrelated extension fragments before interpolation. Required values in selected fragments remain required; no dummy secrets are introduced. Both activation and rollback already use the same recreation function. Twenty-two focused host-agent tests passed on Windows. The actual local Compose set narrowed from 43 to 27 fragments and `config --services` succeeded with LiteLLM present.

That failed rollback had restored the 4B route but left its transaction held because only data/model-state.json differed from the original byte digest (route publication advances its sequence). An explicitly inspected operator repair verified the prior model contract, verified every other captured digest unchanged, and recorded current digests as the rolling-back checkpoint without replacing before evidence. The ordinary recovery endpoint then completed the same transaction and requalified/released both gates. Native controller readback reported pending=false and runtime_verified=true. Automatic recovery of this pre-checkpoint crash remains a follow-up; no weaker general recovery predicate was introduced. The 27B switch is now being retried through the UI with the scoped recreation fix deployed.

### Activated 27B comparison and Linux installer contract (2026-09-21)

The next activation completed: API currentModel and activationReadyModel both report qwen3.8-27b-iq4-xs, modelLifecycle=null, Portal available=true. Its displayed 16K context was preserved. Started the same research-only Click request through the browser in session 23f05242-3299-4847-8949-907120cb54c9, run chatcmpl_949a5ca9-9381-4f1f-b6c3-366d4689c660. Unlike the 4B status loop, the 27B discovered/described the proposal tool, submitted a proposal, then inspected click-python-library after the existing-registration rejection. This is observed model recovery, not proof of a new proposal, installation, or project functionality. The same run entered threshold compaction at 20:19:40 -03; final outcome is still pending at this checkpoint.

PR Linux integration-smoke run 35666204029 failed because the shell installer contract still expected directory-mode discovery and omitted the new read-only skill. Its embedded validator rejected the valid tools-mode candidate, causing subsequent missing-config assertions. Updated the explicit expectations for tools mode, skill registration and replay-safe metadata without weakening validation. Re-ran the complete test-pixel-host-install.sh suite on WSL: 296 passed, 0 failed (exit 0). This is local installer-contract coverage; the full CI rerun and end-to-end harness acceptance remain outstanding.

### 27B comparison outcome and inventory pagination (2026-09-21)

The 27B run resumed successfully after two threshold compactions, but then repeated the rejected proposal and the already successful inspection. It also tried a different nonexistent extension ID. Stopped this research-only comparison through the browser Stop control; native runtime reported idle/active=0 before deployment. No install/advance tool was called. The larger model initially chose more appropriate tools, but this run did not complete the requested research/proposal and does not qualify the autonomous flow.

Its inventory read exposed a separate integration defect: all 203 entries were encoded inside the broker receipt's stdout string, then context limiting cut the JSON in the middle. The read adapter now exposes explicit list offset/limit fields (default 10, maximum 20), returns a valid page with total/nextOffset and observed time, and retains the complete original broker receipt in details. Pagination never changes submitted broker parameters or grants authority; each page is explicitly a fresh observation, not a promised stable snapshot. Unconfirmed, mismatched or truncated envelopes are not promoted into a successful page. Inspection, cancellation and unknown-operation handling remain unchanged.

Validation: 20 host observation/cancellation tests passed on Windows, including a 203-entry inventory, final/empty pages, invalid pagination and intact audit evidence. All 539 guard tests passed on WSL. Deployed only host-observe.mjs after confirming no unrelated local drift, restarted the idle gateway, and called its production read adapter against the real broker. Result: succeeded, 2,065 content characters, page offset=0/limit=10/total=203/nextOffset=10; all 203 entries remained in details. API still reports Portal available=true and the selected 27B activation ready. This verifies the read transport improvement, not model-driven completion. Sandbox provisioning, existing-repository continuation, removal of remaining legacy planning rules and end-to-end project verification remain open.

### Managed sandbox execution qualification and routing-only context (2026-09-21)

Inspected actual configuration: the default sandbox was configured, but Pixel's Full Access override disabled it and sent exec to the gateway. The existing image has Python 3.11.2, Node 22.23.1 and Git; neither pip3 nor uv was available. Restored Sandbox through the ODS UI/controller rather than editing its managed receipt. The controller reported both configured/effective Sandbox. Docker inspected the real pixel-sbx-agent-pixel-50c1e962 container: network=none, readOnlyRootfs=true, capDrop=ALL, user=sandbox. Model/context remained 27B/16384.

Real browser session e813ae24-f56a-41fa-a281-da39529947c1 asked the model to create a standard-library CSV sum program and two test files, execute valid and invalid cases, without installing anything. It selected native write three times and exec once. The real execution returned 61/exit=0 for 10.5,20.5,30 and a nonnumeric abc diagnostic/exit=1 for the invalid file; its final answer matched these observations. Read back valid.csv inside /workspace/Playground/harness-check in the actual sandbox container. This qualifies file creation and execution for this bounded WSL/Docker Desktop case, not arbitrary CSV correctness, package acquisition, sandbox networking, 4B behavior or managed extension installation. Lack of pip and isolated dependency acquisition remain preparation limitations.

Removed a second installation guide embedded in API routing context. It duplicated schemas and imposed an explain-before-propose rule even when the owner explicitly requested a research-only proposal. The hint now carries identity, continuity, scope/authority boundaries and an on-demand guide reference; backend recipe/authority checks are unchanged. All 24 request tests passed, including original follow-up identity and unchanged user message, with a bounded routing hint and no mandatory proposal/prepare/advance sequence. Deployed the module and restarted only dashboard-api after the model run was terminal and native active=0. Other keyword-driven planning rules still require migration; this is not a claim that the whole harness is complete.

### General workspace discovery: preserve model-selected capabilities

Removed the workspace-only interception that replaced the first `tool_search` query
with a fixed file-tool list and rejected subsequent lookups with mandatory write
instructions. Discovery now preserves the chosen query/limit and does not establish
execution authority. Regression coverage includes discovery after workspace inspection,
direct/wrapped admission, and rejection of an unrequested host operation. The shared
run budget, cancellation, process tracking and publication receipts remain in place.
This is one migration stage: the legacy inspection adapter and visual-task sequencing
still exist and must be addressed separately.

Live general-workspace evidence preceding this change: the selected Qwen 3.5 4B
(32768 context, Sandbox) created a Python CSV program and repaired an initial failure,
but assumed a header and second-column schema. A natural correction requesting all
fields and total 61 retained the same project but returned 20.5; repeated invalid
Python diagnostic commands exhausted the guard. A further corrective turn also
failed. This demonstrates real tools and file continuity, not reliable task completion.
No model/context was silently changed to obtain a success. The earlier 27B bounded
CSV test passed; it does not qualify arbitrary repositories or all CSV semantics.

PR #6156 checks at predecessor a3698647 passed, including integration-smoke run
35668332362/job 106558927176. These CI checks do not substitute for live cross-platform
agent and managed-installation qualification.

### Workspace inspection preserves the selected tool's effects

Removed the workspace adapter that changed `read`, `process list`, malformed `exec`,
unknown `ls` IDs and ODS metadata requests into `mkdir && pwd && uname && ls`.
Also removed its compulsory next-write instructions and workspace-only metadata
block. Explicit user exclusions still use the existing exclusion parser; ordinary
metadata reads do not authorize host changes. Unknown IDs and invalid arguments
remain dispatcher/schema errors instead of silently becoming shell execution.
Project workdir inference now requires observed file evidence rather than a planned
inspection. The prompt no longer demands a first write before project commands.

Validation: 538 guard tests and 28 prompt-contract tests pass in WSL. Replacement
regressions assert direct/wrapped read and process-list calls never prepare shell,
selected inspection commands remain unchanged, malformed calls create no execution,
and host changes and explicit observation exclusions stay protected. The count
changed because obsolete adapter-specific tests were replaced, not because an
execution boundary was dropped.

Deployed the two-file diff (including the preceding discovery change) to the local
WSL plugin with `git apply --check`, preserving pre-existing runtime differences
(compact prompt selection and native platform code). Confirmed idle before restart
and idle/active=0 after startup; reverse patch check confirms exact deployment.
A fresh 4B/32768 chat is testing repair of the existing CSV project. Outcome is not
yet qualified by this deployment or the unit suites.

Live outcome for this deployment: session `17b5bb79-2bcc-4bfb-86a6-c38648f01724`
terminated with a failure. The 4B read the existing file, wrote a program still
skipping the first row despite the no-header requirement, ran commands, then wrote
incorrect one-line fixtures containing `header`. Tools executed inside the sandbox;
no adapter supplied the shell plan. It repeated the same fixture write twice and
then attempted a materially different edit. The repeated-write guard had already
set `codingExhausted`, so it rejected that correction. This is both a model semantic
failure and a concrete recovery-policy issue to fix next: repeated no-op attempts
should remain bounded without prematurely prohibiting a different corrective action.
No successful CSV repair or general 4B qualification is claimed.

### Repeated writes do not prohibit a different repair

The live CSV run exposed a local second-write fuse that set `codingExhausted`
for the whole turn. Removed that fuse and its per-path counter. Identical writes
remain refused with factual no-progress feedback; a different edit, rewrite or
inspection is admitted unless an independent boundary or shared progress budget
blocks it. Failed tool results still consume the existing consecutive/total failure
budget, and repeated model rounds remain bounded. No CSV-specific repair is injected.

Validated 539 guard tests plus 11 progress-budget/argument-order tests. The new
regression reproduces two rejected identical writes followed by an admitted changed
edit, and separately proves four consecutive failed results stop the run. Applied
the exact plugin patch locally after idle verification and restarted the gateway.
A natural continuation was submitted to the same 4B chat to test actual recovery;
this unit evidence alone does not prove that the model will correct the CSV logic.

Live continuation outcome: the same 4B/32768 session completed in approximately
27 seconds, changed the program to include the first row, detected invalid numeric
values, ran both cases, and read the program back. It made its valid fixture a
single row rather than the requested two rows. Independent verification then
executed the saved program inside the same sandbox container with temporary fixtures
containing exactly `10.5,20.5\n30\n` and `5.5,abc\n`: results were `Total: 61.0`/exit 0
and the invalid-value error/exit 1. No test code was injected into the agent's program.
This qualifies recovery and these two behaviors, not general CSV parsing (the model
still uses string splitting), arbitrary tasks, or extension installation. The live
continuation did not itself repeat two no-op writes; that exact recovery-policy
branch is covered by the regression test, not by a claimed causal live comparison.
