---
sidebar_position: 4
title: Persistence
---

# Persistence

Cajun provides pluggable persistence backends for stateful actors. Choose between filesystem (simple, portable) or LMDB (high-performance) based on your needs.

:::info Default Behavior
**By default, stateful actors store state in memory only.** Persistence must be explicitly configured using `withPersistence()` when spawning actors. This gives you maximum performance for ephemeral state and zero configuration overhead.
:::

```java
// Default: In-memory only (no persistence)
Pid actor = system.statefulActorOf(MyHandler.class, initialState)
    .spawn();

// Explicit: Add persistence when needed
Pid actor = system.statefulActorOf(MyHandler.class, initialState)
    .withPersistence(
        PersistenceFactory.createFileSnapshotStore(),
        PersistenceFactory.createBatchedFileMessageJournal()
    )
    .spawn();
```

## Quick Comparison

| Backend | Best For | Performance | Portability |
|---------|----------|-------------|-------------|
| **Filesystem** | Development, Testing | Good | Excellent |
| **LMDB** | Production, High-throughput | Excellent (10-100x faster) | Good |

## Available Backends

### Filesystem Persistence

Simple, portable persistence using standard Java file I/O. Perfect for development and testing.

**Key Features:**
- Human-readable files
- Works everywhere (Windows, Linux, macOS)
- Easy to debug and inspect
- No external dependencies

#### Usage
```java
import com.cajunsystems.persistence.PersistenceFactory;

// Create stateful actor with file-based persistence
Pid actor = system.statefulActorOf(MyHandler.class, initialState)
    .withPersistence(
        PersistenceFactory.createFileSnapshotStore("/path/to/snapshots"),
        PersistenceFactory.createBatchedFileMessageJournal("/path/to/journal")
    )
    .spawn();

// Or use default paths (no arguments)
Pid actor = system.statefulActorOf(MyHandler.class, initialState)
    .withPersistence(
        PersistenceFactory.createBatchedFileMessageJournal(),
        PersistenceFactory.createFileSnapshotStore()
    )
    .spawn();
```


### LMDB Persistence (Recommended for Production)

High-performance embedded database with memory-mapped storage. Best for production workloads.

**Key Features:**
- 10-100x faster than filesystem
- ACID transactions
- Zero-copy reads
- Crash-proof
- No server process needed

#### Usage
```java
import com.cajunsystems.persistence.PersistenceFactory;

// Create stateful actor with LMDB persistence
Pid actor = system.statefulActorOf(MyHandler.class, initialState)
    .withPersistence(
        PersistenceFactory.createLmdbSnapshotStore("/path/to/lmdb"),
        PersistenceFactory.createBatchedLmdbMessageJournal("/path/to/lmdb")
    )
    .spawn();

// Or use default paths
Pid actor = system.statefulActorOf(MyHandler.class, initialState)
    .withPersistence(
        PersistenceFactory.createBatchedLmdbMessageJournal(),
        PersistenceFactory.createLmdbSnapshotStore()
    )
    .spawn();
```

#### Configuration
```java
// Persistence uses default configuration
// Snapshot retention and other settings are configured via RecoveryConfig
Pid actor = system.statefulActorOf(MyHandler.class, initialState)
    .withRecoveryConfig(RecoveryConfig.builder()
        .withRecoveryStrategy(RecoveryStrategy.SNAPSHOT_THEN_JOURNAL)
        .withMaxMessagesToRecover(1000)
        .build())
    .withPersistence(
        PersistenceFactory.createBatchedLmdbMessageJournal(),
        PersistenceFactory.createLmdbSnapshotStore()
    )
    .spawn();
```


## When to Use Each Backend

**Use Filesystem for:**
- Development and testing
- Need to inspect data manually
- Small-scale deployments

**Use LMDB for:**
- Production deployments
- High throughput requirements
- Fast recovery times
- Read-heavy workloads

---

## Best Practices

### 1. Snapshot Strategy

```java
// Take snapshots periodically to reduce recovery time
public class MyHandler implements StatefulHandler<State, Message> {
    private int messageCount = 0;
    private static final int SNAPSHOT_INTERVAL = 1000;

    @Override
    public State receive(Message msg, State state, ActorContext ctx) {
        messageCount++;
        State newState = processMessage(msg, state);

        // Trigger snapshot every 1000 messages
        if (messageCount % SNAPSHOT_INTERVAL == 0) {
            ctx.saveSnapshot(newState);
        }

        return newState;
    }
}
```

### 2. Journal Truncation (Filesystem Only)

**Important:** Filesystem journals grow unbounded without cleanup. Cajun provides configurable truncation strategies to manage disk space and improve recovery performance.

#### Truncation Modes

Configure truncation when creating your stateful actor:

```java
import com.cajunsystems.persistence.PersistenceTruncationConfig;
import com.cajunsystems.persistence.PersistenceTruncationMode;

// Option 1: Synchronous truncation (default)
// Journals are truncated during snapshot lifecycle
PersistenceTruncationConfig syncConfig = PersistenceTruncationConfig.builder()
    .mode(PersistenceTruncationMode.SYNC_ON_SNAPSHOT)
    .retainMessagesBehindSnapshot(500)    // Keep 500 messages before latest snapshot
    .retainLastMessagesPerActor(5000)     // Always keep last 5000 messages minimum
    .build();

Pid actor = system.statefulActorOf(MyHandler.class, initialState)
    .withTruncationConfig(syncConfig)
    .withPersistence(
        PersistenceFactory.createFileSnapshotStore(),
        PersistenceFactory.createBatchedFileMessageJournal()
    )
    .spawn();

// Option 2: Asynchronous truncation with background daemon
// Non-blocking truncation runs periodically
PersistenceTruncationConfig asyncConfig = PersistenceTruncationConfig.builder()
    .mode(PersistenceTruncationMode.ASYNC_DAEMON)
    .retainMessagesBehindSnapshot(500)
    .retainLastMessagesPerActor(5000)
    .daemonInterval(Duration.ofMinutes(5))  // Run every 5 minutes
    .build();

Pid actor = system.statefulActorOf(MyHandler.class, initialState)
    .withTruncationConfig(asyncConfig)
    .withPersistence(
        PersistenceFactory.createFileSnapshotStore(),
        PersistenceFactory.createBatchedFileMessageJournal()
    )
    .spawn();

// Option 3: Disable truncation (journals grow indefinitely)
PersistenceTruncationConfig offConfig = PersistenceTruncationConfig.builder()
    .mode(PersistenceTruncationMode.OFF)
    .build();
```

#### Truncation Mode Comparison

| Mode | When It Runs | Performance Impact | Use Case |
|------|--------------|-------------------|----------|
| **OFF** | Never | None | Audit logs, manual cleanup |
| **SYNC_ON_SNAPSHOT** | During snapshot | Slight impact during snapshots | Most use cases, ensures consistency |
| **ASYNC_DAEMON** | Background periodic | Zero impact on actors | High-throughput, latency-critical |

**Benefits:**
- Prevents unbounded journal growth
- Improves recovery time (fewer messages to replay)
- Reduces disk I/O during recovery
- Configurable retention policies

**LMDB:** No truncation needed - automatically reuses space through its B+ tree structure.

### 3. Graceful Shutdown

```java
// LMDB requires explicit close
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    lmdbProvider.close();
    FileSystemTruncationDaemon.getInstance().close();
}));
```



## Common Issues

**LMDB "MDB_MAP_FULL" error:** Increase map size when creating provider

**Filesystem slow writes:** Use `BatchedFileMessageJournal` for better performance

**LMDB backup:** Copy `data.mdb` file or use `mdb_copy` for hot backups
