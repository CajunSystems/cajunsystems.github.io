---
sidebar_position: 2
title: Sender Propagation
---

# Sender Propagation

## Overview

The actor system now supports consistent sender context propagation through actor hierarchies, making it work seamlessly with the ask pattern.

## Two Approaches

### 1. **Using `tell()` - No Sender Propagation (Default)**

When you use `tell()`, the sender context is NOT propagated:

```java
// Grandparent asks Parent
Pid response = grandparent.ask(parentPid, new Request());

// Inside Parent's receive method:
@Override
public void receive(Message msg, ActorContext context) {
    // Sender is available via context
    
    // Send to child using tell - sender context is lost
    childPid.tell(new ChildMessage());
    
    // Inside Child's receive method, no sender context available
}
```

### 2. **Using `forward()` - Preserves Original Sender (New!)**

When you use `forward()`, the original sender context is preserved:

```java
// Grandparent asks Parent
Pid response = grandparent.ask(parentPid, new Request());

// Inside Parent's receive method:
@Override
public void receive(Message msg, ActorContext context) {
    // Sender context available
    
    // Forward to child - preserves grandparent as sender
    context.forward(childPid, new ChildMessage());
    
    // Inside Child's receive method:
    // Sender context preserved - child can reply to grandparent
}
```

## Use Cases

### Use Case 1: Request Forwarding

When an actor acts as a router/proxy and wants the final handler to reply to the original requester:

```java
public class RouterHandler implements Handler<Message> {
    @Override
    public void receive(Message msg, ActorContext context) {
        if (msg instanceof RoutableRequest req) {
            Pid handler = selectHandler(req);
            
            // Forward preserves original sender for reply
            context.forward(handler, req);
        }
    }
}

public class HandlerActor implements Handler<Message> {
    @Override
    public void receive(Message msg, ActorContext context) {
        if (msg instanceof RoutableRequest req) {
            // Process request
            Response response = process(req);
            
            // Reply directly to original requester, not router
            context.reply(response);
        }
    }
}
```

### Use Case 2: Multi-Level Processing Pipeline

```java
// Grandparent initiates request
Pid result = grandparent.ask(parentPid, new ProcessRequest());

// Parent forwards to child
public class ParentHandler implements Handler<Message> {
    @Override
    public void receive(Message msg, ActorContext context) {
        if (msg instanceof ProcessRequest req) {
            // Do some preprocessing
            ProcessRequest enhanced = preprocess(req);
            
            // Forward to child - grandparent remains the sender
            context.forward(childPid, enhanced);
        }
    }
}

// Child processes and replies to grandparent
public class ChildHandler implements Handler<Message> {
    @Override
    public void receive(Message msg, ActorContext context) {
        if (msg instanceof ProcessRequest req) {
            ProcessResult result = process(req);
            
            // Reply goes to grandparent (original requester)
            context.reply(result);
        }
    }
}
```

### Use Case 3: Handler-Based API

The `forward()` method is also available in the handler-based API through `ActorContext`:

```java
public class MyHandler implements Handler<Message> {
    @Override
    public void receive(Message msg, ActorContext context) {
        if (msg instanceof ForwardableRequest req) {
            Pid nextActor = selectNextActor(req);
            
            // Forward preserves sender context
            context.forward(nextActor, req);
        }
    }
}
```

## When to Use Each

| Method | Use When | Sender Context |
|--------|----------|----------------|
| `tell()` | Normal message passing, no reply expected | Lost (Optional.empty()) |
| `forward()` | Acting as intermediary, want final actor to reply to original sender | Preserved |
| `ask()` | Request-response pattern, you are the requester | You become the sender |

## Implementation Details

- Sender context is stored in a `ThreadLocal` variable
- `forward()` wraps the message with `MessageWithSender` to preserve context
- Context is automatically cleared after message processing
- Works seamlessly with the ask pattern
- Compatible with both traditional Actor subclassing and Handler-based API

## Best Practices

1. **Use `forward()` for request routing**: When your actor is a proxy/router
2. **Use `tell()` for fire-and-forget**: When no reply is needed
3. **Use `ask()` for request-response**: When you need a reply
4. **Use Optional methods**: `getSender()` returns `Optional<Pid>` - use `ifPresent()`, `map()`, or `orElse()` for clean handling
