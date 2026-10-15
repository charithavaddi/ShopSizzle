# FinCommerce 🚀
> Enterprise-grade fintech backend and event-driven cloud infrastructure featuring automated double-entry accounting, financial idempotency guards, and fraud quarantine routing.

---

## 🏛️ System Architecture
FinCommerce is designed around a distributed, serverless-adjacent microservices architecture running securely on **AWS**.

```text
 [ Client UI / Storefront ]
        │
        ▼ (HTTPS / REST API)
 [ Node.js / Express Backend ] 
        │
        ├──► [ ElastiCache Redis ] (Idempotency Key Guard / Duplicate Protection)
        ├──► [ RDS PostgreSQL ] (GAAP Double-Entry Financial Ledger)
        │
        ▼ (Event Emission)
 [ AWS EventBridge ] (Central Event Bus)
        │
        ├─ (Valid Transactions) ──► [ Order Fulfilled Successfully ]
        └─ (High Fraud Risk Score >= 85) ──► [ SQS Dead-Letter Queue (DLQ) ]

🛠️ Tech Stack
Backend: Node.js, Express.js, ioredis, pg (node-postgres)

Databases & Caching: AWS RDS PostgreSQL (GAAP Ledger), AWS ElastiCache Redis (Idempotency Cache)

Cloud & Event Infrastructure: AWS VPC, Amazon EventBridge, Amazon SQS & DLQ, ECS Fargate ready

Infrastructure as Code (IaC): Terraform

✨ Key Technical Features
Financial Idempotency Guard:

Protects users from accidental double-charging caused by network retries or double-clicks.

Leverages Redis to cache transaction responses under a unique x-idempotency-key with sub-millisecond replay capability.

GAAP-Compliant Double-Entry Ledger:

Enforces strict accounting balance equality (
∑Debits=∑Credits) across clearing and merchant revenue accounts.

Automated Fraud Quarantine & DLQ Routing:

Suspicious checkout requests exceeding risk thresholds are automatically intercepted by AWS EventBridge and routed directly into an SQS Dead-Letter Queue for administrative review.

Infrastructure as Code (Terraform):

Fully automated provisioning of custom VPCs, private/public subnets, security groups, RDS instances, and event buses.

🚀 Getting Started Locally

1. Clone the Repository

Bash
git clone [https://github.com/YOUR_USERNAME/ShopSizzle.git](https://github.com/YOUR_USERNAME/ShopSizzle.git)
cd ShopSizzle/backend

2. Environment Setup

Create a .env file inside backend/ based on .env.example:

Code snippet

PORT=5000
DATABASE_URL=postgres://finadmin:your_password@your-rds-endpoint.amazonaws.com:5432/fincommercedb
REDIS_HOST=your-elasticache-endpoint.cache.amazonaws.com
REDIS_PORT=6379

3. Install Dependencies & Run

Bash
npm install
npm start

☁️ Managing AWS Infrastructure (Terraform)
To spin up or tear down your cloud resources cleanly:

Bash
cd infrastructure
terraform init
terraform apply   # Provisions VPC, RDS, Redis, EventBridge, SQS
terraform destroy # Shuts down all cloud billing resources