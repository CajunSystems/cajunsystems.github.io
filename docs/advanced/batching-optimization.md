---
sidebar_position: 3
title: Message Batching
---

# Message Batching

Cajun processes messages in batches to improve throughput for high-volume scenarios. By default, actors process up to 10 messages per batch, reducing context switching and mailbox overhead.

## How It Works

Actors drain multiple messages from their mailbox and process them sequentially before polling again:

- **Without batching (size=1)**: Process 1 message → poll → process 1 → poll
- **With batching (size=50)**: Process 50 messages → poll → process 50 → poll

**Benefits:**
- Reduced context switching (fewer poll operations)
- Better CPU cache locality
- Lower mailbox synchronization overhead

## Configuration

Configure batch size using `withBatchSize()` on the actor builder:

```java
// Default batch size is 10
Pid actor = system.actorOf(MyHandler.class).spawn();

// Custom batch size for high throughput
Pid highThroughput = system.actorOf(MyHandler.class)
    .withBatchSize(50)
    .spawn();

// For stateful actors
Pid stateful = system.statefulActorOf(MyHandler.class, initialState)
    .withBatchSize(100)
    .spawn();
```

## Choosing Batch Size

| Batch Size | Use Case | Trade-off |
|------------|----------|----------|
| **1-10** | Interactive, low-latency | Lower throughput, minimal latency |
| **10** (default) | General purpose | Balanced |
| **50-100** | High-throughput processing | Higher latency, maximum throughput |

**Guidelines:**
- **Latency-sensitive**: 1-10
- **Throughput-optimized**: 50-100
- **Bulk processing**: 100+

## Performance Impact

**Typical improvements with batching:**
- 2-3x throughput increase for CPU-light workloads
- 25-50x reduction in mailbox overhead
- Most effective when processing >1000 messages/sec

## Use Cases

### Event Stream Processing

```java
// High-throughput event processor
Pid eventProcessor = system.actorOf(EventHandler.class)
    .withBatchSize(100)
    .spawn();

for (Event event : eventStream) {
    eventProcessor.tell(new ProcessEvent(event));
}
```

### Database Batch Writes

```java
public class DatabaseWriterHandler implements Handler<WriteCommand> {
    private final List<WriteCommand> batch = new ArrayList<>();
    
    @Override
    public void receive(WriteCommand cmd, ActorContext context) {
        batch.add(cmd);
        if (batch.size() >= 10) {
            database.batchWrite(batch);
            batch.clear();
        }
    }
}

Pid writer = system.actorOf(DatabaseWriterHandler.class)
    .withBatchSize(10)
    .spawn();
```

### Message Queue Consumer

```java
// Match batch size to message queue batch size
Pid consumer = system.actorOf(MessageConsumerHandler.class)
    .withBatchSize(200)
    .spawn();
```

## When to Use Batching

**Batching helps most when:**
- High message volume (>1000 messages/sec)
- CPU-light processing
- Bursty traffic patterns
- Sequential processing is acceptable

**Use smaller batches when:**
- Low message volume (&lt;100 messages/sec)
- CPU-heavy processing
- Strict latency requirements (&lt;1ms)
- Interactive request-reply scenarios

## Best Practices

### Start with Defaults

```java
// Start with default batch size (10)
Pid actor = system.actorOf(Handler.class).spawn();

// Measure and adjust based on results
```

### Match to Workload

```java
// Interactive (low latency)
Pid interactive = system.actorOf(Handler.class)
    .withBatchSize(1)
    .spawn();

// Background processing (high throughput)
Pid background = system.actorOf(Handler.class)
    .withBatchSize(100)
    .spawn();
```

### Use Actor Pools for Parallelism

```java
// Multiple actors with moderate batch size
int numActors = Runtime.getRuntime().availableProcessors();
Pid[] pool = new Pid[numActors];

for (int i = 0; i < numActors; i++) {
    pool[i] = system.actorOf(Handler.class)
        .withBatchSize(50)
        .spawn();
}

// Round-robin distribution
int next = 0;
for (Message msg : messages) {
    pool[next++ % numActors].tell(msg);
}
```

## Tuning

**Process:**
1. Start with default (10)
2. Run load test and measure
3. Low throughput + low CPU → increase batch size
4. High latency → decrease batch size
5. Mailbox fills up → increase batch size or add actors

**Key metrics to monitor:**
- Throughput (messages/sec)
- Latency (time from send to process)
- Mailbox depth
- CPU utilization

