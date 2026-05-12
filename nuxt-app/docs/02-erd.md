# ERD

## Diagram ERD

```mermaid
erDiagram
  User ||--o{ ChatSession : owns
  ChatSession ||--o{ Message : contains
  ChatSession ||--o{ ChatQueueJob : queues
  User ||--o{ Passkey : has
  User ||--o{ UnlimitedAccess : grants

  User {
    string id PK
    string email UK
    string name
    string password_hash
    enum role
    datetime created_at
    datetime updated_at
  }

  Passkey {
    string id PK
    string user_id FK
    string credential_id UK
    bytes public_key
    bigint counter
    string device_type
    bool backed_up
    string[] transports
    datetime created_at
  }

  ChatSession {
    string id PK
    string user_id FK
    string name
    string model
    datetime created_at
    datetime updated_at
  }

  Message {
    string id PK
    string session_id FK
    enum role
    text content
    string model
    int token_count
    datetime created_at
  }

  ChatQueueJob {
    string id PK
    string session_id FK
    string user_message_id UK
    string model
    enum status
    datetime created_at
    datetime started_at
    datetime finished_at
    text error_text
  }

  GuestSession {
    string id PK
    string fingerprint UK
    int message_count
    datetime created_at
    datetime last_message_at
  }

  AppSetting {
    string key PK
    string value
    datetime updated_at
    string updated_by
  }

  UnlimitedAccess {
    string id PK
    string token UK
    string label
    string granted_by FK
    datetime granted_at
    datetime expired_at
    bool is_active
    int message_limit
    int message_count
  }
```

## Catatan Relasi

- User -> ChatSession: 1 ke banyak.
- ChatSession -> Message: 1 ke banyak (cascade delete).
- ChatSession -> ChatQueueJob: 1 ke banyak (cascade delete).
- User -> Passkey: 1 ke banyak (cascade delete).
- User -> UnlimitedAccess: 1 ke banyak sebagai admin pemberi token.
- GuestSession berdiri sendiri (berbasis fingerprint cookie).
- AppSetting berdiri sendiri sebagai key-value config global.

## Catatan Domain

- Message.role memakai enum user/assistant/system.
- ChatQueueJob.status memakai enum PENDING/PROCESSING/DONE/FAILED.
- UnlimitedAccess dipakai untuk mode guest bertoken via header x-access-token.
