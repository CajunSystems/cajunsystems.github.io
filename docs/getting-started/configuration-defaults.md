---
sidebar_position: 3
title: Configuration Defaults
---

# Configuration Defaults

Cajun comes with sensible defaults optimized for 99% of use cases. **You don't need to configure anything to get started** - the framework is designed to work out-of-the-box with excellent performance.

:::tip
**All default configurations are optimal** - no tuning required for most applications. Only customize when you have specific requirements.
:::

## Core Defaults

### Thread Pools

**Default: Virtual Threads (I/O-Optimized)**

Cajun uses Java 21+ virtual threads by default, providing optimal performance for I/O-bound workloads.

```java
// Uses virtual threads automatically (default)
Pid actor = system.actorOf(MyHandler.class).spawn();

// Explicitly optimize for workload type
ThreadPoolFactory ioOptimized = new ThreadPoolFactory()
    .optimizeFor(WorkloadType.IO_BOUND);  // Virtual threads (default)

ThreadPoolFactory cpuOptimized = new ThreadPoolFactory()
    .optimizeFor(WorkloadType.CPU_BOUND);  // Fixed platform thread pool

ThreadPoolFactory mixedOptimized = new ThreadPoolFactory()
    .optimizeFor(WorkloadType.MIXED);  // Work-stealing pool

// Apply to specific actors
Pid cpuActor = system.actorOf(ComputeHandler.class)
    .withThreadPoolFactory(cpuOptimized)
    .spawn();
```

**Why virtual threads by default?**
- Minimal overhead for I/O operations (0.02%)
- Support thousands of concurrent actors
- Natural blocking code without callbacks
- Best performance across all tested scenarios

### Mailbox

**Default: LinkedMailbox (LinkedBlockingQueue)**

All actors use a bounded LinkedBlockingQueue mailbox with a capacity of 10,000 messages.

```java
// Uses LinkedMailbox with 10,000 capacity automatically
Pid actor = system.actorOf(MyHandler.class).spawn();

// Customize capacity if needed
Pid actor = system.actorOf(MyHandler.class)
    .withMailboxCapacity(5000)
    .spawn();
```

**Why LinkedMailbox?**
- Bounded capacity provides automatic backpressure
- Low memory overhead
- Fair ordering
- Suitable for most workloads

### Batch Processing

**Default: 10 messages per batch**

Each actor processes messages in batches of 10 at a time to optimize throughput.

```java
// Uses batch size of 10 automatically
Pid actor = system.actorOf(MyHandler.class).spawn();

// Customize batch size if needed
Pid actor = system.actorOf(MyHandler.class)
    .withBatchSize(50)
    .spawn();
```

### Persistence

**Default: Filesystem Persistence**

Stateful actors automatically use filesystem persistence by default with default paths. You can customize the paths or switch to LMDB for production workloads.

```java
// Uses filesystem persistence with default paths automatically
Pid actor = system.statefulActorOf(MyHandler.class, initialState)
    .spawn();

// Customize filesystem paths
Pid actor = system.statefulActorOf(MyHandler.class, initialState)
    .withPersistence(
        PersistenceFactory.createFileSnapshotStore("/custom/snapshots"),
        PersistenceFactory.createBatchedFileMessageJournal("/custom/journal")
    )
    .spawn();

// Use LMDB for production (10-100x faster)
Pid actor = system.statefulActorOf(MyHandler.class, initialState)
    .withPersistence(
        PersistenceFactory.createLmdbSnapshotStore(),
        PersistenceFactory.createBatchedLmdbMessageJournal()
    )
    .spawn();
```

**Why filesystem by default?**
- Works out-of-the-box with zero configuration
- State survives restarts automatically
- Human-readable files for debugging
- Portable across all platforms
- See [Persistence Guide](/docs/core-features/persistence-guide) for details

### Backpressure

**Default: Disabled**

System-wide backpressure is disabled by default. Use bounded mailboxes (the default) for per-actor backpressure.

```java
// No system-wide backpressure (default)
ActorSystem system = new ActorSystem();

// Enable system-wide backpressure if needed
BackpressureConfig config = BackpressureConfig.builder()
    .enabled(true)
    .threshold(8000)
    .strategy(BackpressureStrategy.DROP_NEW)
    .build();

ActorSystem system = new ActorSystem(config);
```

**Why disabled by default?**
- Bounded mailboxes provide natural backpressure
- Most applications don't need system-wide limits
- Simpler mental model
- See [Backpressure Guide](/docs/core-features/backpressure) for details

### Actor IDs

**Default: Auto-generated UUIDs**

Actor IDs are automatically generated as UUIDs when not explicitly provided.

```java
// Auto-generated UUID (default)
Pid actor = system.actorOf(MyHandler.class).spawn();

// Explicit ID
Pid actor = system.actorOf(MyHandler.class)
    .withId("my-actor")
    .spawn();

// ID template with counter
Pid actor = system.actorOf(MyHandler.class)
    .withIdTemplate("worker-{}")
    .spawn();  // Creates: worker-1, worker-2, etc.
```

See [Actor ID Strategies](/docs/core-features/actor-id-strategies) for advanced ID management.

## Summary Table

| Component | Default | Configurable | When to Change |
|-----------|---------|--------------|----------------|
| **Thread Pool** | Virtual Threads (IO_BOUND) | ✅ Yes | Use CPU_BOUND or MIXED workload types for different performance characteristics |
| **Mailbox** | LinkedMailbox (10k capacity) | ✅ Yes | High-throughput CPU-bound workloads may benefit from MpscMailbox |
| **Batch Size** | 10 messages | ✅ Yes | Tune for latency vs throughput tradeoff |
| **Persistence** | Filesystem | ✅ Yes | Use LMDB for high-performance production workloads |
| **Backpressure** | Disabled | ✅ Yes | Enable for system-wide flow control |
| **Actor IDs** | Auto-generated UUID | ✅ Yes | Use explicit IDs for debugging or routing |

## Best Practices

### Start with Defaults

```java
// ✅ Good: Start simple
ActorSystem system = new ActorSystem();
Pid actor = system.actorOf(MyHandler.class).spawn();
```

```java
// ❌ Avoid: Premature optimization
ActorSystem system = new ActorSystem(complexConfig);
Pid actor = system.actorOf(MyHandler.class)
    .withThreadPoolFactory(customPool)
    .withMailboxCapacity(50000)
    .withBatchSize(100)
    .spawn();
```

### Profile Before Optimizing

Only change defaults after:
1. Measuring actual performance
2. Identifying specific bottlenecks
3. Understanding the tradeoffs

### Document Configuration Changes

When you deviate from defaults, document why:

```java
// Custom configuration for high-throughput ingestion
// Profiling showed mailbox capacity was the bottleneck
Pid ingestor = system.actorOf(IngestionHandler.class)
    .withMailboxCapacity(50_000)  // Increased from default 10k
    .withBatchSize(100)           // Increased from default 10
    .spawn();
```

## Next Steps

- Learn about [Mailbox Configuration](/docs/core-features/mailbox-guide)
- Explore [Persistence Options](/docs/core-features/persistence-guide)
- Understand [Backpressure Strategies](/docs/core-features/backpressure)
- Read [Performance Benchmarks](/docs/performance/benchmarks)
