---
sidebar_position: 3
title: Backpressure
---

# Backpressure

Cajun provides a robust backpressure system to help actors manage high load scenarios effectively. Backpressure is an opt-in feature that controls message flow when mailboxes approach capacity.

## Overview

Backpressure prevents actors from being overwhelmed by too many messages. When enabled, it monitors mailbox capacity and applies strategies to handle overload situations.

## Configuration

### System-Wide Configuration

Configure backpressure for all actors in an ActorSystem:

```java
// Define backpressure settings
BackpressureConfig config = new BackpressureConfig()
    .setStrategy(BackpressureStrategy.BLOCK)
    .setWarningThreshold(0.7f)      // 70% capacity
    .setCriticalThreshold(0.9f)     // 90% capacity
    .setRecoveryThreshold(0.5f);    // 50% capacity

// Create ActorSystem with backpressure
ActorSystem system = new ActorSystem(new ThreadPoolFactory(), config);
```

**Note:** If no `BackpressureConfig` is provided, backpressure is disabled by default.

### Actor-Specific Configuration

Override system defaults or enable backpressure for specific actors using `BackpressureBuilder`:

```java
// Configure specific actor
BackpressureBuilder<Message> builder = new BackpressureBuilder<>(myActor)
    .withStrategy(BackpressureStrategy.DROP_OLDEST)
    .withWarningThreshold(0.7f)
    .withCriticalThreshold(0.9f)
    .withRecoveryThreshold(0.5f);

builder.apply();

// Or configure via PID through ActorSystem
system.getBackpressureMonitor()
    .configureBackpressure(actorPid)
    .withStrategy(BackpressureStrategy.DROP_OLDEST)
    .withWarningThreshold(0.7f)
    .withCriticalThreshold(0.9f)
    .apply();
```

## Backpressure States

The system operates with four states:

| State | Description |
|-------|-------------|
| **NORMAL** | Operating with sufficient capacity |
| **WARNING** | Approaching capacity limits (above warning threshold) |
| **CRITICAL** | At or above critical threshold, backpressure active |
| **RECOVERY** | Recovering from critical state (below critical but above recovery threshold) |

## Backpressure Strategies

Choose how the system responds when mailbox capacity is exceeded:

### BLOCK (Default)

Block the sender until space is available in the mailbox.

```java
new BackpressureBuilder<>(actor)
    .withStrategy(BackpressureStrategy.BLOCK)
    .apply();
```

**Use when:** All messages must be processed and senders can wait.

### DROP_NEW

Reject new messages when mailbox is full, keeping older messages.

```java
new BackpressureBuilder<>(actor)
    .withStrategy(BackpressureStrategy.DROP_NEW)
    .apply();
```

**Use when:** Older messages have higher priority than newer ones.

### DROP_OLDEST

Remove oldest messages to make room for new ones.

```java
new BackpressureBuilder<>(actor)
    .withStrategy(BackpressureStrategy.DROP_OLDEST)
    .apply();
```

**Use when:** Newer messages are more important (e.g., real-time data).

### CUSTOM

Implement custom backpressure logic:

```java
CustomBackpressureHandler<Message> handler = new CustomBackpressureHandler<>() {
    @Override
    public boolean handleMessage(Actor<Message> actor, Message message, 
                                 BackpressureSendOptions options) {
        // Custom logic to decide whether to accept the message
        if (message.isPriority()) {
            return true; // Always accept priority messages
        }
        return actor.getCurrentSize() < actor.getCapacity() * 0.9;
    }
    
    @Override
    public boolean makeRoom(Actor<Message> actor) {
        // Custom logic to make room in the mailbox
        return actor.dropOldestMessage();
    }
};

new BackpressureBuilder<>(actor)
    .withStrategy(BackpressureStrategy.CUSTOM)
    .withCustomHandler(handler)
    .apply();
```

## Preset Configurations

Use preset configurations for common scenarios:

```java
// Time-critical: DROP_OLDEST strategy, prioritizes newer messages
new BackpressureBuilder<>(actor)
    .presetTimeCritical()
    .apply();

// Reliable: BLOCK strategy, never drops messages
new BackpressureBuilder<>(actor)
    .presetReliable()
    .apply();

// High-throughput: Optimized for maximum processing capacity
new BackpressureBuilder<>(actor)
    .presetHighThroughput()
    .apply();
```

## Sending Messages with Options

Control backpressure behavior when sending messages:

```java
// High priority message (bypasses backpressure)
BackpressureSendOptions highPriority = new BackpressureSendOptions()
    .setHighPriority(true)
    .setTimeout(Duration.ofSeconds(5));

actor.tell(urgentMessage, highPriority);

// Or use system to send with options
boolean accepted = system.tellWithOptions(actorPid, message, highPriority);

// Block until message is accepted or timeout
BackpressureSendOptions blockingOptions = new BackpressureSendOptions()
    .setBlockUntilAccepted(true)
    .setTimeout(Duration.ofSeconds(3));

system.tellWithOptions(actorPid, message, blockingOptions);
```

## Monitoring

### Register Callbacks

Get notified of backpressure state changes:

```java
new BackpressureBuilder<>(actor)
    .withStrategy(BackpressureStrategy.DROP_OLDEST)
    .withWarningThreshold(0.7f)
    .withCriticalThreshold(0.9f)
    .withCallback(event -> {
        logger.info("Backpressure event: {} state, fill ratio: {}", 
                    event.getState(), event.getFillRatio());
        
        if (event.isBackpressureActive()) {
            // Take action: notify monitoring, scale resources, etc.
        }
    })
    .apply();
```

### Check Status

Query current backpressure status:

```java
BackpressureStatus status = actor.getBackpressureStatus();
BackpressureState currentState = status.getCurrentState();
float fillRatio = status.getFillRatio();

// Access event history
List<BackpressureEvent> recentEvents = status.getRecentEvents();
List<StateTransition> transitions = status.getStateTransitions();

// Monitor state transitions
for (StateTransition transition : transitions) {
    logger.debug("Transition from {} to {} at {} due to: {}", 
                transition.getFromState(), 
                transition.getToState(),
                transition.getTimestamp(),
                transition.getReason());
}
```

## Best Practices

### Choose the Right Strategy

- **BLOCK**: When all messages must be processed and senders can wait
- **DROP_NEW**: When older messages have higher priority
- **DROP_OLDEST**: When newer messages are more important (real-time data)
- **CUSTOM**: For specialized requirements

### Set Appropriate Thresholds

```java
new BackpressureBuilder<>(actor)
    .withWarningThreshold(0.7f)     // Start monitoring at 70%
    .withCriticalThreshold(0.9f)    // Activate backpressure at 90%
    .withRecoveryThreshold(0.5f)    // Deactivate at 50%
    .apply();
```

**Guidelines:**
- Warning: 0.5-0.7 (start monitoring)
- Critical: 0.8-0.9 (activate backpressure)
- Recovery: 0.3-0.5 (deactivate backpressure)

### Use Monitoring

Always monitor backpressure events in production:

```java
.withCallback(event -> {
    if (event.getState() == BackpressureState.CRITICAL) {
        metrics.incrementCounter("backpressure.critical");
        alerting.sendAlert("Actor " + actor.getId() + " under backpressure");
    }
})
```

### High Priority Messages

Use high priority for critical messages that should bypass backpressure:

```java
BackpressureSendOptions priority = new BackpressureSendOptions()
    .setHighPriority(true);

actor.tell(criticalMessage, priority);
```

## Example: Complete Setup

```java
// System-wide configuration
BackpressureConfig systemConfig = new BackpressureConfig()
    .setStrategy(BackpressureStrategy.BLOCK)
    .setWarningThreshold(0.7f)
    .setCriticalThreshold(0.9f)
    .setRecoveryThreshold(0.5f);

ActorSystem system = new ActorSystem(new ThreadPoolFactory(), systemConfig);

// Create actor (inherits system config)
Pid actor = system.actorOf(MyHandler.class).spawn();

// Override for specific actor with monitoring
system.getBackpressureMonitor()
    .configureBackpressure(actor)
    .withStrategy(BackpressureStrategy.DROP_OLDEST)
    .withWarningThreshold(0.6f)
    .withCriticalThreshold(0.85f)
    .withCallback(event -> {
        logger.warn("Backpressure: {} at {}% capacity", 
                   event.getState(), 
                   event.getFillRatio() * 100);
    })
    .apply();

// Send messages with options
BackpressureSendOptions options = new BackpressureSendOptions()
    .setHighPriority(false)
    .setTimeout(Duration.ofSeconds(5));

boolean accepted = system.tellWithOptions(actor, message, options);
if (!accepted) {
    logger.error("Message rejected due to backpressure");
}
```

## Summary

- **Opt-in feature**: Configure via `BackpressureConfig` or `BackpressureBuilder`
- **Four states**: NORMAL, WARNING, CRITICAL, RECOVERY
- **Four strategies**: BLOCK, DROP_NEW, DROP_OLDEST, CUSTOM
- **Preset configurations**: timeCritical, reliable, highThroughput
- **Monitoring**: Callbacks and status queries for observability
- **High priority**: Bypass backpressure for critical messages
