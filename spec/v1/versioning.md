# OpenDataLayer Protocol Specification v1 — Versioning

**Status:** Draft
**Version:** 1.0.0
**Last Updated:** 2026-02-23

---

## 1. Introduction

This document defines the versioning strategy for the OpenDataLayer (ODL) protocol. Versioning ensures that producers and consumers can evolve independently while maintaining interoperability. Every ODL event carries a `specVersion` field that declares which version of the protocol it conforms to.

## 2. The specVersion Field

### 2.1 Presence

Every ODL event envelope MUST include a `specVersion` field. This field is a top-level, required string that identifies the version of the ODL specification the event conforms to.

```json
{
  "event": "page.view",
  "id": "...",
  "timestamp": "...",
  "specVersion": "1.0.0",
  "context": { ... }
}
```

### 2.2 Format

The `specVersion` field MUST be a string in **semantic versioning** format:

```
MAJOR.MINOR.PATCH
```

Where:
- **MAJOR** is a non-negative integer.
- **MINOR** is a non-negative integer.
- **PATCH** is a non-negative integer.

Examples: `"1.0.0"`, `"1.1.0"`, `"2.0.0"`.

Pre-release and build metadata suffixes (e.g., `"1.0.0-beta.1"`, `"1.0.0+build.123"`) are NOT permitted in the `specVersion` field. Only stable releases are valid values.

### 2.3 Usage

The `specVersion` field serves two purposes:

1. **Consumer compatibility.** A consumer can check the `specVersion` to determine whether it knows how to process an event. A consumer built for spec version 1.x SHOULD gracefully handle events from any 1.x version.

2. **Migration detection.** When a producer upgrades to a new spec version, the changed `specVersion` signals to the pipeline and consumers that the event shape may have changed.

## 3. Semantic Versioning

ODL follows [Semantic Versioning 2.0.0](https://semver.org/) for the protocol specification itself. The version number conveys the nature of changes between releases.

### 3.1 MAJOR Version

A MAJOR version increment (e.g., 1.x.x to 2.0.0) indicates **breaking changes** that are not backward compatible. Examples of breaking changes:

- Removing a required field from the event envelope.
- Changing the type of an existing field (e.g., `id` from `string` to `number`).
- Removing an event from the core taxonomy.
- Changing the meaning or semantics of an existing field.
- Changing the event naming convention.
- Removing a context object.

After a MAJOR version increment, consumers MUST NOT assume that events from the new version are compatible with their existing processing logic.

### 3.2 MINOR Version

A MINOR version increment (e.g., 1.0.x to 1.1.0) indicates **backward-compatible additions**. Examples:

- Adding a new optional field to the event envelope.
- Adding a new event to the taxonomy.
- Adding a new context object.
- Adding new optional fields to an existing context object.
- Adding a new conformance level.
- Adding a new middleware stage.

Events from a newer MINOR version MUST be consumable by a consumer built for an older MINOR version of the same MAJOR version. The consumer simply ignores fields and events it does not recognize.

### 3.3 PATCH Version

A PATCH version increment (e.g., 1.0.0 to 1.0.1) indicates **backward-compatible fixes** that do not change the protocol's functional behavior. Examples:

- Correcting a typo in the specification text.
- Clarifying ambiguous wording.
- Fixing an error in a JSON Schema definition that did not match the specification text.
- Adding examples.

PATCH changes MUST NOT alter the shape, meaning, or behavior of any part of the protocol.

## 4. Backward Compatibility Guarantees

### 4.1 Within a MAJOR Version

All releases within the same MAJOR version (e.g., 1.0.0, 1.1.0, 1.2.0, 1.2.1) are **backward compatible**. This means:

- A consumer built for spec version 1.0.0 MUST be able to process events from spec version 1.1.0 without errors (it may ignore new fields).
- A producer emitting events at spec version 1.1.0 MUST emit events that are valid against the 1.0.0 envelope schema (plus additional fields).
- Middleware built for 1.0.0 MUST NOT break when encountering events from 1.1.0.

### 4.2 Across MAJOR Versions

There are **no backward compatibility guarantees** across MAJOR versions. An event from spec version 2.0.0 MAY be completely incompatible with a consumer built for spec version 1.x.

However, implementations SHOULD provide migration tools and documentation to help users transition between MAJOR versions. See [Section 6](#6-migration-strategy).

### 4.3 Forward Compatibility

ODL does not guarantee forward compatibility. A consumer built for spec version 1.1.0 is NOT required to understand events from spec version 1.0.0 if the consumer relies on fields introduced in 1.1.0. However, in practice, this is unlikely to be a problem because MINOR versions only add optional fields.

**Recommendation:** Consumers SHOULD be lenient in what they accept. If a field introduced in 1.1.0 is absent from an event tagged as 1.0.0, the consumer SHOULD use a sensible default or skip that field rather than rejecting the event.

## 5. Schema Evolution Rules

The following rules govern how the ODL schema can evolve between versions.

### 5.1 Additive Changes (MINOR version)

The following changes are additive and require only a MINOR version increment:

| Change | Impact |
|---|---|
| Add a new optional field to the event envelope | Consumers ignore unknown fields |
| Add a new optional field to a context object | Consumers ignore unknown fields |
| Add a new event to the taxonomy | Consumers ignore unknown events |
| Add a new context object | Consumers ignore unknown context objects |
| Add a new optional field to an event's data payload | Consumers ignore unknown fields |
| Add a new enum value to an existing field | Consumers treat unknown values as "other" or ignore |
| Widen a field's type (e.g., `string` to `string | number`) | Existing consumers already handle the original type |

### 5.2 Breaking Changes (MAJOR version)

The following changes are breaking and require a MAJOR version increment:

| Change | Impact |
|---|---|
| Remove a field from the event envelope | Consumers that depend on the field will break |
| Change a field's type (narrowing) | Consumers expecting the old type may break |
| Rename a field | Consumers referencing the old name will break |
| Remove an event from the taxonomy | Consumers subscribed to the event will stop receiving it |
| Change the event naming convention | All consumers must update their subscriptions |
| Make an optional field required | Older producers may not include the field |
| Remove a context object | Consumers that depend on the context will break |
| Change the meaning/semantics of a field | Consumers may misinterpret the data |

### 5.3 Deprecation Process

Before a breaking change is made in a MAJOR version, the affected feature SHOULD go through a deprecation process:

1. **Deprecation notice.** In a MINOR release, the feature is marked as deprecated in the specification. The JSON Schema MAY include a `deprecated: true` annotation.

2. **Migration period.** At least one MINOR release MUST pass between deprecation and removal. This gives producers and consumers time to migrate.

3. **Removal.** In the next MAJOR release, the deprecated feature is removed.

**Example timeline:**
- Version 1.2.0: The `device.userAgent` field is deprecated with a note recommending Client Hints instead.
- Version 1.3.0: The deprecation remains; implementations receive warnings when using the deprecated field.
- Version 2.0.0: The `device.userAgent` field is removed from the specification.

## 6. Migration Strategy

### 6.1 Between PATCH Versions

No migration is needed. PATCH versions do not change the protocol's behavior.

### 6.2 Between MINOR Versions

Upgrading from a lower MINOR version to a higher one within the same MAJOR version requires no code changes. The producer can simply update the `specVersion` field and optionally start populating new fields.

Downgrading is also safe — a producer can lower its `specVersion` without breaking consumers, though it should stop using fields introduced in the higher version.

### 6.3 Between MAJOR Versions

Migrating between MAJOR versions is a significant effort. ODL provides the following mechanisms to ease the transition:

#### 6.3.1 Migration Guides

Each MAJOR version release MUST include a migration guide that documents:

- Every breaking change.
- The recommended action for each breaking change.
- Code examples showing before/after.

#### 6.3.2 Dual-Version Emission

During a migration period, producers MAY emit events in both the old and new spec versions simultaneously. This allows consumers to migrate at their own pace.

```json
// Producer emits both versions during migration
{
  "event": "page.view",
  "specVersion": "2.0.0",
  "context": { /* v2 format */ },
  "_legacySpecVersion": "1.0.0",
  "_legacyContext": { /* v1 format */ }
}
```

The `_legacy*` fields are not part of the core protocol and are provided as a migration convenience. They SHOULD be stripped by middleware once migration is complete.

#### 6.3.3 Version Translation Middleware

Implementations SHOULD provide middleware that can translate events from one MAJOR version to another. For example, a v1-to-v2 translation middleware would take a v1 event and produce a v2 event by applying the necessary transformations.

```
v1 Event → [v1→v2 Translation Middleware] → v2 Event
```

This allows consumers to upgrade to v2 while some producers still emit v1 events.

#### 6.3.4 Coexistence Period

The ODL project SHOULD maintain both the old and new MAJOR versions for at least 12 months after the new version is released. During this period, both versions receive PATCH releases for critical bug fixes.

## 7. Version Negotiation

### 7.1 Consumer Version Declaration

Consumers SHOULD declare which spec versions they support. This can be done through:

- A configuration option (e.g., `supportedVersions: ["1.*"]`).
- A subscription parameter (e.g., subscribing with a version filter).

### 7.2 Version Mismatch Handling

When a consumer receives an event with a `specVersion` it does not support:

- If the MAJOR version matches but the MINOR version is higher: The consumer SHOULD process the event, ignoring unknown fields.
- If the MAJOR version matches but the MINOR version is lower: The consumer SHOULD process the event, using defaults for missing optional fields.
- If the MAJOR version does not match: The consumer SHOULD log a warning and either reject the event or pass it to a version translation middleware.

## 8. Release Process

### 8.1 Draft Specifications

New versions of the ODL specification begin as drafts. Draft specifications are published with a `Draft` status indicator and are subject to change without following the normal versioning rules.

### 8.2 Release Candidates

Before a new MAJOR or MINOR version is finalized, at least one Release Candidate (RC) SHOULD be published. RCs are feature-complete but may receive bug fixes before the final release.

### 8.3 Stable Releases

Stable releases are published with a version number (e.g., `1.0.0`) and are subject to the full backward compatibility guarantees described in this document.

### 8.4 Long-Term Support

MAJOR versions that are superseded SHOULD receive at least 12 months of Long-Term Support (LTS), during which critical bug fixes are backported as PATCH releases. After the LTS period, the old MAJOR version is marked as End of Life (EOL).

## 9. Version History

| Version | Date | Status | Notes |
|---|---|---|---|
| 1.0.0 | 2026-02-23 | Draft | Initial specification. |
