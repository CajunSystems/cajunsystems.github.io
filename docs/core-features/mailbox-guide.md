---
sidebar_position: 2
title: Mailbox Guide
---

# Mailbox Guide

Cajun provides two mailbox implementations for actor message queues. Choose based on your workload and backpressure needs.

## Quick Comparison

| Mailbox | Best For | Performance | Bounded |
|---------|----------|-------------|------|
| **LinkedMailbox** | General-purpose, needs backpressure | Good | ✅ Yes |
| **MpscMailbox** | High-throughput CPU-bound | Excellent (2-3x faster) | ❌ No |

## LinkedMailbox (Default)

General-purpose mailbox with bounded capacity for backpressure control.

**When to use:**
- General-purpose actors
- Need backpressure control
- Memory-constrained environments

**Features:**
- Bounded capacity (default 10,000)
- Low memory overhead

**Usage:**
```java
// Default - automatically uses LinkedMailbox
Pid actor = system.actorOf(MyHandler.class).spawn();

// Custom capacity
Pid actor = system.actorOf(MyHandler.class)
    .withMailboxCapacity(5000)
    .spawn();
```

## MpscMailbox (High-Performance)

Lock-free mailbox for high-throughput CPU-bound workloads. **Unbounded** - requires monitoring.

**When to use:**
- High-throughput CPU-bound workloads
- Low-latency requirements
- Many senders, single consumer
- Can tolerate unbounded growth

**Features:**
- Lock-free multi-producer, single-consumer
- 2-3x faster than LinkedMailbox
- **Unbounded** - monitor queue depth!

**Usage:**
```java
// Use for CPU-bound workloads
Pid actor = system.actorOf(MyHandler.class)
    .withThreadPoolFactory(
        new ThreadPoolFactory().optimizeFor(WorkloadType.CPU_BOUND)
    )
    .spawn();
```

## Choosing the Right Mailbox

**Use LinkedMailbox (default) for:**
- Most use cases
- Need backpressure control
- Memory-constrained environments

**Use MpscMailbox for:**
- High-throughput CPU-bound workloads
- Can tolerate unbounded growth
- Have monitoring in place

## Monitoring

**Important:** MpscMailbox is unbounded - monitor queue depth:

```java
int queueSize = ((Actor<?>) system.getActor(pid)).getMailboxSize();
if (queueSize > 10_000) {
    logger.warn("High mailbox depth: {}", queueSize);
}
```

## Configuration

**Batch size** (messages processed per drain):
```java
Pid actor = system.actorOf(MyHandler.class)
    .withBatchSize(100)  // Default: 10
    .spawn();
```

**Mailbox capacity** (LinkedMailbox only):
```java
Pid actor = system.actorOf(MyHandler.class)
    .withMailboxCapacity(5000)  // Default: 10,000
    .spawn();
```
