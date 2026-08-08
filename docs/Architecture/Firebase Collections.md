# Firebase Collections Plan

This is the planned cloud model. Final collection names and security rules will be confirmed in the Firebase implementation PR.

## Planned top-level collections

- `users`
- `organizations`
- `teams`
- `seasons`
- `players`
- `rosterMemberships`
- `scheduleEvents`
- `matches`
- `matchEvents`
- `rotations`
- `practicePlans`
- `reports`
- `syncOperations`

## Key principles

- Every record includes stable IDs, created/updated timestamps, and ownership context.
- Team and season IDs are stored on frequently queried records to support efficient offline and cloud queries.
- Match events are stored individually and ordered by timestamp and sequence number.
- Corrections do not silently erase history; they create correction metadata or replacement events.
- Offline actions receive a client-generated ID before synchronization.
- Security rules enforce organization membership and role permissions.

## Local-first relationship

Firebase is the shared cloud source, but important match and schedule actions save locally first. The local database and synchronization queue will be designed before live stat collection is connected to production data.
